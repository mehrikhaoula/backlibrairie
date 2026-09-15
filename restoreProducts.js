require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");

const Produit = require("./models/ProduitModel");

const EXCEL_FILE = "./products.xlsx";

async function restoreProducts() {
  try {
    console.log("🔄 RESTAURATION Excel → MongoDB...\n");

    // ===============================
    // MONGODB
    // ===============================

    if (!process.env.mongo_url) {
      throw new Error("❌ mongo_url introuvable dans .env");
    }

    await mongoose.connect(process.env.mongo_url);

    console.log("✅ MongoDB connecté");

    // ===============================
    // EXCEL
    // ===============================

    const workbook = XLSX.readFile(EXCEL_FILE);

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows =
      XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Excel : ${rows.length} produits`);

    if (!rows.length) {
      throw new Error("❌ Excel vide");
    }

    // ===============================
    // PREPARATION
    // ===============================

    const products = [];

    for (const [index, row] of rows.entries()) {

      const name =
        String(row.Nom || "").trim();

      const sourceUrl =
        String(row.SourceUrl || "").trim();

      const category =
        String(row.Categorie || "").trim();

      const price =
        Number(row.Prix) || 0;

      if (!name || !category) {
        console.log(
          `⚠️ Ligne ${index + 2} ignorée : données manquantes`
        );

        continue;
      }

      products.push({
        name,

        brand:
          String(
            row.Marque || "RayArt"
          ).trim() || "RayArt",

        category,

        imageUrl:
          String(
            row.ImageUrl || ""
          ).trim(),

        price,

        description:
          String(
            row.Description || ""
          ).trim(),

        discount:
          Number(row.Remise) || 0,

        quantite:
          Number(row.Quantite) || 200,

        sourceUrl,
      });
    }

    console.log(
      `📦 Produits prêts : ${products.length}`
    );

    // ===============================
    // INSERTION
    // ===============================

    if (products.length === 0) {
      throw new Error(
        "❌ Aucun produit valide à importer"
      );
    }

    const result =
      await Produit.insertMany(products);

    // ===============================
    // RESULTAT
    // ===============================

    console.log("\n======================================");
    console.log("🎉 RESTAURATION TERMINÉE");
    console.log("======================================");

    console.log(
      `📊 Excel          : ${rows.length}`
    );

    console.log(
      `🍃 MongoDB ajouté : ${result.length}`
    );

    const finalCount =
      await Produit.countDocuments();

    console.log(
      `🍃 MongoDB total  : ${finalCount}`
    );

    console.log("======================================");

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

restoreProducts();