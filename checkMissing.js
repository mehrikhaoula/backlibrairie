const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Produit = require("./models/ProduitModel");

const EXCEL_FILE = "./products.xlsx";

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function checkMissing() {
  let connected = false;

  try {
    console.log("🔎 Vérification des produits manquants...\n");

    // ===============================
    // MONGODB
    // ===============================

    if (!process.env.mongo_url) {
      throw new Error("mongo_url introuvable dans .env");
    }

    await mongoose.connect(process.env.mongo_url);

    connected = true;

    console.log("✅ MongoDB connecté");

    // ===============================
    // EXCEL
    // ===============================

    console.log("📂 Lecture de products.xlsx...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const excelProducts =
      XLSX.utils.sheet_to_json(worksheet);

    console.log(
      `📊 Excel : ${excelProducts.length}`
    );

    // ===============================
    // MONGODB
    // ===============================

    const mongoProducts =
      await Produit.find({});

    console.log(
      `🍃 MongoDB : ${mongoProducts.length}`
    );

    // ===============================
    // NAMES MONGODB
    // ===============================

    const mongoNames = new Set();

    for (const product of mongoProducts) {
      mongoNames.add(
        normalizeName(product.name)
      );
    }

    // ===============================
    // FIND MISSING
    // ===============================

    const missing = [];

    for (const product of excelProducts) {

      const name =
        String(product.Nom || "").trim();

      if (!name) {
        continue;
      }

      const key =
        normalizeName(name);

      if (!mongoNames.has(key)) {
        missing.push(product);
      }
    }

    // ===============================
    // RESULT
    // ===============================

    console.log(
      "\n======================================"
    );

    console.log(
      "🔍 PRODUITS MANQUANTS"
    );

    console.log(
      "======================================"
    );

    console.log(
      `📦 Excel       : ${excelProducts.length}`
    );

    console.log(
      `🍃 MongoDB     : ${mongoProducts.length}`
    );

    console.log(
      `❌ Manquants   : ${missing.length}`
    );

    console.log(
      "======================================"
    );

    // ===============================
    // LIST
    // ===============================

    if (missing.length > 0) {

      console.log(
        "\n📋 Liste des produits manquants:\n"
      );

      missing.forEach((product, index) => {

        console.log(
          `${index + 1}. ${product.Nom}`
        );

      });

    } else {

      console.log(
        "\n✅ Aucun produit manquant !"
      );
    }

  } catch (error) {

    console.error(
      "\n❌ ERREUR COMPLÈTE:"
    );

    console.error(error);

  } finally {

    if (connected) {
      await mongoose.disconnect();

      console.log(
        "\n🔌 MongoDB déconnecté"
      );
    }
  }
}

checkMissing();