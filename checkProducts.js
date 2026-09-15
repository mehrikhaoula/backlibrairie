const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Produit = require("./models/ProduitModel");

const EXCEL_FILE = "./products.xlsx";

async function checkProducts() {
  try {
    console.log("🔎 Vérification Excel ↔ MongoDB...\n");

    // ===============================
    // CONNECT
    // ===============================

    const mongo_url = process.env.mongo_url;

    if (!mongo_url) {
      throw new Error(
        "❌ mongo_url introuvable dans .env"
      );
    }

    await mongoose.connect(mongo_url);

    console.log("✅ MongoDB connecté");

    // ===============================
    // EXCEL
    // ===============================

    const workbook =
      XLSX.readFile(EXCEL_FILE);

    const worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const excelProducts =
      XLSX.utils.sheet_to_json(
        worksheet
      );

    console.log(
      `📊 Excel : ${excelProducts.length} produits`
    );

    // ===============================
    // MONGODB
    // ===============================

    const mongoProducts =
      await Produit.find({});

    console.log(
      `🍃 MongoDB : ${mongoProducts.length} produits`
    );

    // ===============================
    // STATS
    // ===============================

    let sourceUrlsExcel = 0;
    let namesExcel = 0;

    for (const product of excelProducts) {
      const sourceUrl =
        String(
          product.SourceUrl || ""
        ).trim();

      const name =
        String(
          product.Nom || ""
        ).trim();

      if (sourceUrl) {
        sourceUrlsExcel++;
      }

      if (name) {
        namesExcel++;
      }
    }

    let sourceUrlsMongo = 0;
    let emptySourceUrlMongo = 0;

    for (const product of mongoProducts) {
      if (
        product.sourceUrl &&
        product.sourceUrl.trim()
      ) {
        sourceUrlsMongo++;
      } else {
        emptySourceUrlMongo++;
      }
    }

    // ===============================
    // DISPLAY
    // ===============================

    console.log(
      "\n======================================"
    );

    console.log(
      "📊 ÉTAT ACTUEL"
    );

    console.log(
      "======================================"
    );

    console.log(
      `📦 Excel total              : ${excelProducts.length}`
    );

    console.log(
      `🔗 Excel avec SourceUrl     : ${sourceUrlsExcel}`
    );

    console.log(
      `📝 Excel avec Nom           : ${namesExcel}`
    );

    console.log(
      `🍃 MongoDB total            : ${mongoProducts.length}`
    );

    console.log(
      `🔗 MongoDB avec SourceUrl   : ${sourceUrlsMongo}`
    );

    console.log(
      `⚠️ MongoDB sans SourceUrl   : ${emptySourceUrlMongo}`
    );

    console.log(
      "======================================"
    );

    // ===============================
    // SAMPLE
    // ===============================

    console.log(
      "\n🔍 Exemple Excel:"
    );

    console.log(
      excelProducts
        .slice(0, 5)
        .map((p) => ({
          name: p.Nom,
          sourceUrl: p.SourceUrl,
        }))
    );

    console.log(
      "\n🔍 Exemple MongoDB:"
    );

    console.log(
      mongoProducts
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          sourceUrl: p.sourceUrl,
        }))
    );

  } catch (error) {

    console.error(
      "\n❌ ERREUR :",
      error.message
    );

  } finally {

    await mongoose.disconnect();

    console.log(
      "\n🔌 MongoDB déconnecté"
    );
  }
}

checkProducts();