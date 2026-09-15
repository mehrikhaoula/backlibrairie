require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const Produit = require("./models/ProduitModel");

// MongoDB
mongoose.connect(process.env.mongo_url)

const mongo_url = process.env.mongo_url;

// Excel
const FILE_PATH = "./products.xlsx";

async function importProducts() {
  try {
    console.log("🔄 Connexion à MongoDB...");

    await mongoose.connect(process.env.mongo_url);

    console.log("✅ MongoDB connecté");

    // قراءة Excel
    const workbook = XLSX.readFile(FILE_PATH);

    // أول Sheet
    const sheetName = workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];

    // تحويل Excel إلى JSON
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`📦 ${rows.length} produits trouvés dans Excel`);

    if (rows.length === 0) {
      console.log("❌ Le fichier Excel est vide");
      return;
    }

    const products = rows
      .map((row, index) => {
        if (!row.name || !row.category || !row.price) {
          console.log(
            `⚠️ Produit ligne ${index + 2} ignoré : données manquantes`
          );

          return null;
        }

        return {
          name: String(row.name).trim(),

          brand: row.brand
            ? String(row.brand).trim()
            : "RayArt",

          category: String(row.category).trim(),

          price: Number(row.price),

          description: row.description
            ? String(row.description).trim()
            : "",

          imageUrl: row.imageUrl
            ? String(row.imageUrl).trim()
            : "",

          // Toujours 0
          discount: 0,

          // Stock fixe
          quantite: 200,
        };
      })
      .filter(Boolean);

    console.log(`✅ ${products.length} produits prêts à être importés`);

    // Insertion en une seule opération
    const result = await Produit.insertMany(products);

    console.log(
      `🎉 ${result.length} produits ajoutés avec succès !`
    );

  } catch (error) {
    console.error("❌ Erreur :", error);

  } finally {
    await mongoose.connection.close();

    console.log("🔌 Connexion MongoDB fermée");
  }
}

importProducts();