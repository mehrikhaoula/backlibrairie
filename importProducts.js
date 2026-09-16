require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const Produit = require("./models/ProduitModel");

const FILE_PATH = "./products.xlsx";

async function importProducts() {
  try {
    console.log("🔄 Connexion à MongoDB...");

    await mongoose.connect(process.env.mongo_url);

    console.log("✅ MongoDB connecté");

    // =========================
    // LIRE EXCEL
    // =========================

    const workbook = XLSX.readFile(FILE_PATH);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`📦 ${rows.length} produits trouvés dans Excel`);

    if (rows.length === 0) {
      console.log("❌ Le fichier Excel est vide");
      return;
    }

    // =========================
    // CONVERTIR EXCEL → PRODUITS
    // =========================

    const products = rows
      .map((row, index) => {
        if (
          !row.Nom ||
          !row.Categorie ||
          row.Prix === undefined ||
          row.Prix === null ||
          row.Prix === ""
        ) {
          console.log(
            `⚠️ Produit ligne ${index + 2} ignoré : données manquantes`
          );

          return null;
        }

        return {
          name: String(row.Nom).trim(),

          brand: row.Marque
            ? String(row.Marque).trim()
            : "RayArt",

          category: String(row.Categorie).trim(),

          price: Number(row.Prix),

          description: row.Description
            ? String(row.Description).trim()
            : "",

          imageUrl: row.ImageUrl
            ? String(row.ImageUrl).trim()
            : "",

          discount:
            row.Remise !== undefined &&
            row.Remise !== ""
              ? Number(row.Remise)
              : 0,

          quantite:
            row.Quantite !== undefined &&
            row.Quantite !== ""
              ? Number(row.Quantite)
              : 200,
        };
      })
      .filter(Boolean);

    console.log(
      `✅ ${products.length} produits prêts à être importés`
    );

    if (products.length === 0) {
      console.log("❌ Aucun produit valide à importer");
      return;
    }

    // =========================
    // INSERTION MONGODB
    // =========================

    const result = await Produit.insertMany(products);

    console.log(
      `🎉 ${result.length} produits ajoutés avec succès !`
    );

  } catch (error) {
    console.error("❌ Erreur import :", error);

  } finally {
    await mongoose.connection.close();

    console.log("🔌 Connexion MongoDB fermée");
  }
}

importProducts();