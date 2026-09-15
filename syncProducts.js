const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Produit = require("./models/ProduitModel");

const EXCEL_FILE = "./products.xlsx";

async function syncProducts() {
  try {
    console.log("🚀 Sync Excel → MongoDB...\n");

    const mongo_url = process.env.mongo_url;

    if (!mongo_url) {
      throw new Error("❌ mongo_url introuvable");
    }

    await mongoose.connect(mongo_url);

    console.log("✅ MongoDB connecté");

    // ===============================
    // EXCEL
    // ===============================

    const workbook = XLSX.readFile(EXCEL_FILE);

    const worksheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const excelProducts =
      XLSX.utils.sheet_to_json(worksheet);

    console.log(
      `📊 Excel : ${excelProducts.length} produits`
    );

    // Sécurité
    if (!excelProducts.length) {
      console.log(
        "🛑 Excel vide → aucun changement"
      );
      return;
    }

    // ===============================
    // SETS
    // ===============================

    const excelSourceUrls = new Set();
    const excelNames = new Set();

    let created = 0;
    let updated = 0;
    let errors = 0;

    // ===============================
    // CREATE / UPDATE
    // ===============================

    for (const [index, product] of excelProducts.entries()) {
      try {
        const name =
          String(product.Nom || "").trim();

        const sourceUrl =
          String(product.SourceUrl || "").trim();

        const category =
          String(product.Categorie || "").trim();

        if (!name) {
          console.log(
            `⚠️ Ligne ${index + 2}: Nom manquant`
          );

          errors++;
          continue;
        }

        if (!sourceUrl) {
          console.log(
            `⚠️ ${name}: SourceUrl manquante`
          );

          errors++;
          continue;
        }

        if (!category) {
          console.log(
            `⚠️ ${name}: Catégorie manquante`
          );

          errors++;
          continue;
        }

        excelSourceUrls.add(sourceUrl);
        excelNames.add(name);

        const data = {
          name,

          brand:
            String(
              product.Marque || "RayArt"
            ).trim() || "RayArt",

          category,

          imageUrl:
            String(
              product.ImageUrl || ""
            ).trim(),

          price:
            Number(product.Prix) || 0,

          description:
            String(
              product.Description || ""
            ).trim(),

          discount:
            Number(product.Remise) || 0,

          quantite:
            Number(product.Quantite) || 200,

          sourceUrl,
        };

        // ===============================
        // FIND
        // ===============================

        let existing =
          await Produit.findOne({
            sourceUrl,
          });

        // Ancien produit sans sourceUrl
        if (!existing) {
          existing =
            await Produit.findOne({
              name,
              sourceUrl: "",
            });
        }

        // ===============================
        // UPDATE
        // ===============================

        if (existing) {
          await Produit.updateOne(
            { _id: existing._id },
            { $set: data }
          );

          updated++;

        } else {

          // ===============================
          // CREATE
          // ===============================

          await Produit.create(data);

          created++;
        }

      } catch (error) {
        errors++;

        console.log(
          `❌ Ligne ${index + 2}: ${error.message}`
        );
      }
    }

    // ===============================
    // DELETE
    // ===============================

    console.log(
      "\n🗑️ Recherche des produits à supprimer..."
    );

    const mongoProducts =
      await Produit.find({});

    let deleted = 0;

    for (const product of mongoProducts) {

      let existsInExcel = false;

      // Product avec SourceUrl
      if (product.sourceUrl) {
        existsInExcel =
          excelSourceUrls.has(
            product.sourceUrl
          );
      }

      // Ancien product sans SourceUrl
      else {
        existsInExcel =
          excelNames.has(
            product.name
          );
      }

      // Pas dans Excel → DELETE
      if (!existsInExcel) {
        await Produit.deleteOne({
          _id: product._id,
        });

        deleted++;

        console.log(
          `🗑️ Supprimé : ${product.name}`
        );
      }
    }

    // ===============================
    // RESULT
    // ===============================

    console.log(
      "\n======================================"
    );

    console.log(
      "📊 RÉSULTAT SYNCHRONISATION"
    );

    console.log(
      "======================================"
    );

    console.log(
      `📦 Excel       : ${excelProducts.length}`
    );

    console.log(
      `🆕 Créés       : ${created}`
    );

    console.log(
      `🔄 Mis à jour  : ${updated}`
    );

    console.log(
      `🗑️ Supprimés   : ${deleted}`
    );

    console.log(
      `❌ Erreurs     : ${errors}`
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

syncProducts();