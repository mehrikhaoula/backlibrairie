const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Produit = require("./models/ProduitModel");

const EXCEL_FILE = "./products.xlsx";

// =====================================
// NORMALIZE NAME
// =====================================

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================
// MAIN
// =====================================

async function repairProducts() {
  try {
    console.log("🛠️ Réparation MongoDB ↔ Excel...\n");

    // =====================================
    // MONGODB
    // =====================================

    const mongo_url = process.env.mongo_url;

    if (!mongo_url) {
      throw new Error("❌ mongo_url introuvable");
    }

    await mongoose.connect(mongo_url);

    console.log("✅ MongoDB connecté");

    // =====================================
    // EXCEL
    // =====================================

    console.log("📂 Lecture de products.xlsx...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const excelProducts =
      XLSX.utils.sheet_to_json(worksheet);

    console.log(
      `📊 Excel : ${excelProducts.length} produits`
    );

    if (!excelProducts.length) {
      throw new Error("❌ Excel vide");
    }

    // =====================================
    // EXCEL MAP
    // =====================================

    const excelMap = new Map();

    for (const product of excelProducts) {
      const name = String(product.Nom || "").trim();

      if (!name) continue;

      const key = normalizeName(name);

      // Si duplicate dans Excel
      if (!excelMap.has(key)) {
        excelMap.set(key, product);
      }
    }

    console.log(
      `📋 Produits uniques Excel : ${excelMap.size}`
    );

    // =====================================
    // MONGODB
    // =====================================

    const mongoProducts = await Produit.find({});

    console.log(
      `🍃 MongoDB avant réparation : ${mongoProducts.length}`
    );

    // =====================================
    // TRACKING
    // =====================================

    const usedMongoIds = new Set();

    let updated = 0;
    let deletedDuplicates = 0;
    let deletedOld = 0;
    let created = 0;

    // =====================================
    // PROCESS EXCEL
    // =====================================

    for (const [key, excelProduct] of excelMap) {

      const name =
        String(excelProduct.Nom || "").trim();

      const brand =
        String(
          excelProduct.Marque || "RayArt"
        ).trim() || "RayArt";

      const category =
        String(
          excelProduct.Categorie || ""
        ).trim();

      const imageUrl =
        String(
          excelProduct.ImageUrl || ""
        ).trim();

      const sourceUrl =
        String(
          excelProduct.SourceUrl || ""
        ).trim();

      const description =
        String(
          excelProduct.Description || ""
        ).trim();

      const price =
        Number(excelProduct.Prix) || 0;

      const discount =
        Number(excelProduct.Remise) || 0;

      const quantite =
        Number(excelProduct.Quantite) || 200;

      // =====================================
      // FIND ALL SAME NAME
      // =====================================

      const matches =
        mongoProducts.filter(
          (mongoProduct) =>
            normalizeName(mongoProduct.name) === key
        );

      // =====================================
      // EXISTING PRODUCT
      // =====================================

      if (matches.length > 0) {

        // نحتفظ بأول نسخة
        const mainProduct = matches[0];

        usedMongoIds.add(
          mainProduct._id.toString()
        );

        // UPDATE
        await Produit.updateOne(
          {
            _id: mainProduct._id,
          },
          {
            $set: {
              name,
              brand,
              category,
              imageUrl,
              price,
              description,
              discount,
              quantite,
              sourceUrl,
            },
          }
        );

        updated++;

        // =====================================
        // DELETE DUPLICATES
        // =====================================

        if (matches.length > 1) {

          for (
            let i = 1;
            i < matches.length;
            i++
          ) {

            await Produit.deleteOne({
              _id: matches[i]._id,
            });

            deletedDuplicates++;
          }
        }

      } else {

        // =====================================
        // CREATE MISSING PRODUCT
        // =====================================

        const newProduct =
          await Produit.create({
            name,
            brand,
            category,
            imageUrl,
            price,
            description,
            discount,
            quantite,
            sourceUrl,
          });

        usedMongoIds.add(
          newProduct._id.toString()
        );

        created++;
      }
    }

    // =====================================
    // DELETE PRODUCTS NOT IN EXCEL
    // =====================================

    const currentMongoProducts =
      await Produit.find({});

    for (const product of currentMongoProducts) {

      if (
        !usedMongoIds.has(
          product._id.toString()
        )
      ) {

        await Produit.deleteOne({
          _id: product._id,
        });

        deletedOld++;
      }
    }

    // =====================================
    // FINAL COUNT
    // =====================================

    const finalCount =
      await Produit.countDocuments();

    // =====================================
    // RESULT
    // =====================================

    console.log(
      "\n======================================"
    );

    console.log(
      "🛠️ RÉSULTAT RÉPARATION"
    );

    console.log(
      "======================================"
    );

    console.log(
      `📦 Excel             : ${excelProducts.length}`
    );

    console.log(
      `🍃 MongoDB final     : ${finalCount}`
    );

    console.log(
      `🔄 Mis à jour        : ${updated}`
    );

    console.log(
      `🆕 Créés             : ${created}`
    );

    console.log(
      `♻️ Doublons supprimés : ${deletedDuplicates}`
    );

    console.log(
      `🗑️ Anciens supprimés : ${deletedOld}`
    );

    console.log(
      "======================================"
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

repairProducts();