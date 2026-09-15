const axios = require("axios");
const cheerio = require("cheerio");
const XLSX = require("xlsx");

// =====================================
// CONFIG
// =====================================

const BASE_URL = "https://www.rayart.com.tn";
const HOME_URL = `${BASE_URL}/2-accueil`;

const productsMap = new Map();

const client = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  },
});

// =====================================
// CLEAN TEXT
// =====================================

function cleanText(text) {
  return (
    text
      ?.replace(/\s+/g, " ")
      .replace(/\n/g, " ")
      .trim() || ""
  );
}

// =====================================
// URL ABSOLUE
// =====================================

function absoluteUrl(url) {
  if (!url) return "";

  if (url.startsWith("http")) {
    return url;
  }

  if (url.startsWith("//")) {
    return "https:" + url;
  }

  if (url.startsWith("/")) {
    return BASE_URL + url;
  }

  return `${BASE_URL}/${url}`;
}

// =====================================
// EXTRAIRE PRIX
// =====================================

function extractPrice(text) {
  if (!text) return 0;

  const clean = text
    .replace(/\s/g, "")
    .replace(",", ".");

  const match = clean.match(/(\d+(?:\.\d+)?)\s*TND/i);

  return match ? Number(match[1]) : 0;
}

// =====================================
// EXTRAIRE REMISE
// =====================================

function extractDiscount(text) {
  if (!text) return 0;

  const match = text.match(/-(\d+(?:\.\d+)?)\s*%/);

  return match ? Number(match[1]) : 0;
}

// =====================================
// EXTRAIRE PRODUITS D'UNE PAGE
// =====================================

function extractProducts(html, categoryName = "") {
  const $ = cheerio.load(html);

  const products = [];

  $(".product-miniature").each((index, element) => {
    const el = $(element);

    // ===============================
    // NAME
    // ===============================

    const name = cleanText(
      el.find(".product-title a").first().text()
    );

    if (!name) return;

    // ===============================
    // PRODUCT URL
    // ===============================

    const sourceUrl = absoluteUrl(
      el.find(".product-title a").first().attr("href")
    );

    // ===============================
    // IMAGE
    // ===============================

    let imageUrl =
      el.find("img").attr("data-full-size-image-url") ||
      el.find("img").attr("data-src") ||
      el.find("img").attr("src") ||
      "";

    imageUrl = absoluteUrl(imageUrl);

    // ===============================
    // PRIX
    // ===============================

    const regularPriceText = cleanText(
      el.find(".regular-price").text()
    );

    const currentPriceText = cleanText(
      el.find(".price").text()
    );

    let oldPrice = 0;
    let price = 0;

    if (regularPriceText) {
      oldPrice = extractPrice(regularPriceText);
    }

    price = extractPrice(currentPriceText);

    if (!price && oldPrice) {
      price = oldPrice;
    }

    // ===============================
    // DISCOUNT
    // ===============================

    const discountText = cleanText(
      el.find(".discount-percentage").text()
    );

    let discount = extractDiscount(discountText);

    if (!discount) {
      discount = extractDiscount(
        cleanText(el.text())
      );
    }

    // ===============================
    // BRAND
    // ===============================

    const brand =
      cleanText(
        el.find(".product-brand").text()
      ) || "";

    // ===============================
    // DESCRIPTION
    // ===============================

    const description =
      cleanText(
        el.find(".product-description").text()
      ) || "";

    // ===============================
    // UNIQUE ID
    // ===============================

    const key =
      sourceUrl ||
      name.toLowerCase();

    products.push({
      key,
      name,
      brand,
      category: categoryName,
      price,
      oldPrice,
      discount,
      description,
      quantite: 200,
      imageUrl,
      sourceUrl,
    });
  });

  return products;
}

// =====================================
// DISCOVER CATEGORIES
// =====================================

async function discoverCategories() {
  console.log("\n🔎 Recherche des catégories RayArt...");

  const response = await client.get(HOME_URL);

  const $ = cheerio.load(response.data);

  const categories = new Map();

  $("a[href]").each((index, element) => {
    let href = $(element).attr("href");

    if (!href) return;

    href = absoluteUrl(href);

    try {
      const url = new URL(href);

      // On garde seulement les URLs du site
      if (url.hostname !== "www.rayart.com.tn") {
        return;
      }

      // Enlève query/hash
      const pathname = url.pathname;

      // Exemple:
      // /156-feutres
      // /124-peintures-acryliques
      //
      // Mais on exclut:
      // /accueil/2801-produit
      if (
        /^\/\d+-[^/]+$/.test(pathname) &&
        !pathname.startsWith("/accueil/")
      ) {
        const name = cleanText(
          $(element).text()
        );

        if (name) {
          categories.set(
            pathname,
            {
              url: BASE_URL + pathname,
              name,
            }
          );
        }
      }
    } catch {
      // ignore
    }
  });

  const result = [...categories.values()];

  console.log(
    `📚 ${result.length} catégories trouvées`
  );

  return result;
}

// =====================================
// SCRAPE CATEGORY
// =====================================

async function scrapeCategory(category) {
  console.log("\n======================================");
  console.log(`📚 CATÉGORIE : ${category.name}`);
  console.log(`🌐 ${category.url}`);
  console.log("======================================");

  let page = 1;

  while (true) {
    try {
      const url =
        page === 1
          ? category.url
          : `${category.url}?page=${page}`;

      console.log(`📄 Lecture page ${page}...`);

      const response = await client.get(url);

      const products = extractProducts(
        response.data,
        category.name
      );

      console.log(
        `   ➜ ${products.length} produits`
      );

      // Aucun produit = fin
      if (products.length === 0) {
        break;
      }

      // Ajouter dans Map
      for (const product of products) {
        const existing = productsMap.get(
          product.key
        );

        if (existing) {
          // Si le produit existe déjà
          // mais n'a pas de catégorie,
          // on lui ajoute la catégorie actuelle

          if (
            product.category &&
            !existing.category.includes(
              product.category
            )
          ) {
            existing.category +=
              `, ${product.category}`;
          }
        } else {
          productsMap.set(
            product.key,
            product
          );
        }
      }

      // Si moins de 24 produits,
      // probablement dernière page
      if (products.length < 24) {
        break;
      }

      page++;

      // Petite pause pour éviter
      // d'envoyer trop de requêtes
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

    } catch (error) {
      console.log(
        `❌ Erreur page ${page}:`,
        error.message
      );

      // On passe à la catégorie suivante
      break;
    }
  }
}

// =====================================
// EXPORT EXCEL
// =====================================

function createExcel() {
  const products = [...productsMap.values()];

  console.log("\n======================================");
  console.log(
    `📊 TOTAL UNIQUE : ${products.length}`
  );
  console.log("======================================");

  const excelData = products.map((product) => ({
    Nom: product.name,
    Marque: product.brand,
    Categorie: product.category,
    Prix: product.price,
    AncienPrix: product.oldPrice,
    Remise: product.discount,
    Description: product.description,
    Quantite: 200,
    ImageUrl: product.imageUrl,
    SourceUrl: product.sourceUrl,
  }));

  const worksheet =
    XLSX.utils.json_to_sheet(excelData);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Produits"
  );

  // largeur colonnes
  worksheet["!cols"] = [
    { wch: 50 }, // Nom
    { wch: 25 }, // Marque
    { wch: 35 }, // Catégorie
    { wch: 12 }, // Prix
    { wch: 12 }, // Ancien prix
    { wch: 10 }, // Remise
    { wch: 60 }, // Description
    { wch: 12 }, // Quantité
    { wch: 70 }, // Image
    { wch: 80 }, // Source
  ];

  XLSX.writeFile(
    workbook,
    "products.xlsx"
  );

  console.log(
    "\n✅ products.xlsx créé avec succès !"
  );

  console.log(
    `📦 ${products.length} produits dans Excel`
  );
}

// =====================================
// MAIN
// =====================================

async function start() {
  try {
    console.log(
      "🚀 Démarrage RayArt → Excel..."
    );

    const categories =
      await discoverCategories();

    if (!categories.length) {
      console.log(
        "❌ Aucune catégorie trouvée."
      );

      return;
    }

    for (const category of categories) {
      await scrapeCategory(category);
    }

    createExcel();

  } catch (error) {
    console.error(
      "\n❌ ERREUR GÉNÉRALE :",
      error.message
    );
  }
}

start();