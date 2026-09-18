const mongoose = require("mongoose");
const Produit = require("../models/ProduitModel");
const Categorie = require("../models/CategModel");

const MONGO_URI = process.env.MONGO_URI;

const createCategories = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connecté");

    // récupérer toutes les catégories uniques des produits
    const categories = await Produit.distinct("category");

    console.log("📦 Catégories trouvées :", categories);

    let created = 0;

    for (const category of categories) {
      if (!category || !category.trim()) continue;

      const cleanCategory = category.trim();

      const exists = await Categorie.findOne({
        type: cleanCategory,
      });

      if (!exists) {
        await Categorie.create({
          NomCategorie: cleanCategory,
          type: cleanCategory,
        });

        created++;
        console.log(`✅ Catégorie créée : ${cleanCategory}`);
      }
    }

    console.log(`🎉 ${created} catégories créées`);

    const allCategories = await Categorie.find();
    console.log("📋 Total catégories :", allCategories.length);

    await mongoose.disconnect();
    console.log("🔌 MongoDB déconnecté");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur :", error);
    process.exit(1);
  }
};

createCategories();