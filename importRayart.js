const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

const Product = require("./models/ProductModel");

// ===============================
// CONFIG
// ===============================

const RAYART_URL = "https://www.rayart.com.tn/2-accueil";

// MongoDB متاعك
const MONGO_URI = process.env.MONGO_URI;


// ===============================
// تنظيف النصوص
// ===============================

function cleanText(text) {
  return text
    ?.replace(/\s+/g, " ")
    .replace(/\n/g, " ")
    .trim() || "";
}


// ===============================
// استخراج prix
// ===============================

function extractPrice(text) {
  if (!text) return 0;

  const match = text
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*TND/);

  return match ? Number(match[1]) : 0;
}


// ===============================
// SCRAPE PAGE
// ===============================

async function scrapePage(page = 1) {

  const url =
    page === 1
      ? RAYART_URL
      : `${RAYART_URL}?page=${page}`;

  console.log("\n=================================");
  console.log("PAGE :", page);
  console.log("URL  :", url);
  console.log("=================================");

  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    },
  });

  const $ = cheerio.load(response.data);

  const products = [];

  $(".product-miniature").each((index, element) => {

    const el = $(element);

    // ===============================
    // NAME
    // ===============================

    const name = cleanText(
      el.find(".product-title a").text()
    );

    if (!name) return;

    // ===============================
    // PRODUCT URL
    // ===============================

    const productUrl =
      el.find(".product-title a").attr("href") || "";

    // ===============================
    // IMAGE
    // ===============================

    let imageUrl =
      el.find("img").attr("data-full-size-image-url") ||
      el.find("img").attr("data-src") ||
      el.find("img").attr("src") ||
      "";

    // تحويل URL relative → absolute
    if (imageUrl.startsWith("/")) {
      imageUrl = "https://www.rayart.com.tn" + imageUrl;
    }

    // ===============================
    // PRICE
    // ===============================

    const regularPriceText = cleanText(
      el.find(".regular-price").text()
    );

    const currentPriceText = cleanText(
      el.find(".price").text()
    );

    let price;

    if (regularPriceText) {
      price = extractPrice(regularPriceText);
    } else {
      price = extractPrice(currentPriceText);
    }

    // ===============================
    // BRAND
    // ===============================

    const brand =
      cleanText(
        el.find(".product-brand").text()
      ) || "";

    // ===============================
    // CATEGORY
    // ===============================

    const category = "";

    // ===============================
    // PRODUCT
    // ===============================

    products.push({
      name,

      brand,

      category,

      price,

      discount: 0,

      oldPrice: 0,

      description: "",

      quantite: 200,

      imageUrl,

      sourceUrl: productUrl,
    });

  });

  console.log(
    `Produits trouvés : ${products.length}`
  );

  return products;
}


// ===============================
// MAIN
// ===============================

async function start() {

  try {

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connecté");

    // TEST : seulement première page
    const products = await scrapePage(1);

    console.log("\n========== PRODUITS ==========\n");

    console.log(
      JSON.stringify(products, null, 2)
    );

    console.log(
      `\n✅ ${products.length} produits récupérés`
    );

    await mongoose.disconnect();

  } catch (error) {

    console.error(
      "❌ ERREUR :",
      error.message
    );

    await mongoose.disconnect();

  }

}

start();