const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Produit = require("./models/ProduitModel");

// =====================================
// CONFIG
// =====================================

const EXCEL_FILE = "./products.xlsx";

// =====================================
// SYNC EXCEL → MONGODB
// =====================================

async function syncProducts() {
  try {
    console.log("🚀 Démarrage Sync Excel → MongoDB...\n");

    // ===============================
    // CONNECT MONGODB
    // ===============================

    const mongo_url = process.env.mongo_url;

    if (!mongo_url) {
      throw new Error(
        "❌ mongo_url introuvable dans le fichier .env"
      );
    }

    await mongoose.connect(mongo_url);

    console.log("✅ MongoDB connecté");

    // ===============================
    // READ EXCEL
    // ===============================

    console.log("\n📂 Lecture de products.xlsx...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const products = XLSX.utils.sheet_to_json(worksheet);

    console.log(
      `📊 ${products.length} produits trouvés dans Excel`
    );

    if (!products.length) {
      console.log("❌ Aucun produit trouvé dans Excel");
      return;
    }

    // ===============================
    // COUNTERS
    // ===============================

    let created = 0;
    let updated = 0;
    let errors = 0;

    // ===============================
    // SYNC PRODUCTS
    // ===============================

    for (const [index, product] of products.entries()) {
      try {
        const name = String(product.Nom || "").trim();

        if (!name) {
          console.log(
            `⚠️ Ligne ${index + 2}: nom manquant`
          );

          errors++;
          continue;
        }

        const category =
          String(product.Categorie || "").trim();

        if (!category) {
          console.log(
            `⚠️ ${name}: catégorie manquante`
          );

          errors++;
          continue;
        }

        // ===============================
        // DATA
        // ===============================

        const productData = {
          name,

          brand:
            String(product.Marque || "RayArt").trim(),

          category,

          imageUrl:
            String(product.ImageUrl || "").trim(),

          price:
            Number(product.Prix) || 0,

          description:
            String(product.Description || "").trim(),

          discount:
            Number(product.Remise) || 0,

          quantite:
            Number(product.Quantite) || 200,
        };

        // ===============================
        // FIND PRODUCT
        // ===============================

        const existing = await Produit.findOne({
          name,
        });

        // ===============================
        // UPDATE
        // ===============================

        if (existing) {
          await Produit.updateOne(
            { _id: existing._id },
            { $set: productData }
          );

          updated++;

          console.log(
            `🔄 UPDATE ${updated}/${products.length} : ${name}`
          );

        } else {
          // ===============================
          // CREATE
          // ===============================

          await Produit.create(productData);

          created++;

          console.log(
            `🆕 CREATE ${created}/${products.length} : ${name}`
          );
        }

      } catch (error) {
        errors++;

        console.log(
          `❌ Erreur ligne ${index + 2}:`,
          error.message
        );
      }
    }

    // ===============================
    // SUMMARY
    // ===============================

    console.log("\n======================================");
    console.log("📊 RÉSULTAT SYNCHRONISATION");
    console.log("======================================");

    console.log(
      `📦 Total Excel : ${products.length}`
    );

    console.log(
      `🆕 Créés       : ${created}`
    );

    console.log(
      `🔄 Mis à jour  : ${updated}`
    );

    console.log(
      `❌ Erreurs     : ${errors}`
    );

    console.log("======================================");

  } catch (error) {
    console.error(
      "\n❌ ERREUR GÉNÉRALE :",
      error.message
    );

  } finally {
    await mongoose.disconnect();

    console.log("\n🔌 MongoDB déconnecté");
  }
}

syncProducts();