const categorie = require("../models/CategModel");

const categorieCtrl = {
  ajouterCatg: async (req, res) => {
    try {
      const { NomCategorie, type } = req.body;
  
      // Vérification des champs requis
      if (!type) {
        return res.status(400).json({ msg: 'type est requis', success: false,  error: true 
        });
      }
      // Création de la nouvelle catégorie
      const newCat = new categorie({ NomCategorie, type }); // Modèle Mongoose
      await newCat.save();
  
      // Réponse en cas de succès
      res.status(201).json({  msg: 'Catégorie créée avec succès',  data: newCat,  success: true,  error: false 
      });
  
    } catch (error) {
      // Gestion de l'erreur de doublon sur le champ 'type'
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          msg: `Le type '${req.body.type}' existe déjà`,
          success: false,
        });
      }
      // Gestion des autres erreurs
      res.status(500).json({ 
        msg: error.message || 'Erreur serveur', success: false, error: true });
    }
  },

  initCategories: async (req, res) => {
  try {
    const Produit = require("../models/ProduitModel");

    // Récupérer les catégories uniques des produits
    const categories = await Produit.distinct("category");

    let created = 0;

    for (const category of categories) {
      if (!category || !category.trim()) continue;

      const cleanCategory = category.trim();

      // Vérifier si la catégorie existe déjà
      const exists = await categorie.findOne({
        type: cleanCategory,
      });

      if (!exists) {
        await categorie.create({
          NomCategorie: cleanCategory,
          type: cleanCategory,
        });

        created++;
        console.log(`✅ Catégorie créée : ${cleanCategory}`);
      }
    }

    const allCategories = await categorie.find();

    res.json({
      success: true,
      error: false,
      message: `${created} catégories créées avec succès`,
      total: allCategories.length,
      data: allCategories,
    });
  } catch (error) {
    console.error("❌ INIT CATEGORIES:", error);

    res.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
},

  supprimercatg:async(req,res)=>{
    try {
        let {id}=req.params
        let findcategorie=await categorie.findByIdAndDelete({_id:id})
        res.json({resultet:findcategorie,msg:"categorie deleted"})
    } catch (error) {
        return res.status(500).json({msg:error.message})
    }
},
getAllCatg: async (req, res) => {
    try {
      let findcategorie = await categorie.find();

      res.status(201).json({
        data: findcategorie,
        success: true,
        error: false,
      });
    } catch (err) {
      res.json({
        message: err.message || err,
        error: true,
        success: false,
      });
    }
  },
  modifierCatg: async (req, res) => {
    try {
      let { id } = req.params;
      let {NomCategorie,type}= req.body;
      let updatecategorie = await categorie.findByIdAndUpdate({ _id: id },{NomCategorie,type});
      res.json({ msg: 'Catégorie modifiée avec succès', data: updatecategorie });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  supprimerType: async (req, res) => {
    try {
      let { type } = req.body;
      let findtype = await categorie.deleteOne({ type });
      res.json({ resultat: findtype, msg: "Type Supprimer" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getCategById: async (req, res) => {
    try {
      let { id } = req.params;
      let findcategorie = await categorie.findById({ _id: id });
      res.json({ result: findcategorie });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getCategByNom: async (req, res) => {
    try {
      let { NomCategorie } = req.body;
      let findcategorie = await NomCategorie.findOne({ NomCategorie });
      res.json({ result: findcategorie });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getCategByType: async (req, res) => {
    try {
      let { type } = req.body;
      let findtype = await categorie.find({ type });
      res.json({ result: findtype });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  getCategorie: async (req, res) => {
    try {
      const Allcatgr = await categorie.find();
      const totalCategorie = await categorie.countDocuments();
      res.json({
        message: "All categorie",
        success: true,
        error: false,
        data: Allcatgr,
        totalCategorie,
      });
    } catch (err) {
      res.status(400).json({
        message: err.message || err,
        error: true,
        success: false,
      });
    }
  },
};

module.exports = categorieCtrl;