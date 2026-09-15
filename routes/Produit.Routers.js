let router = require("express").Router();

let produitCtrl = require("../Controllers/ProduitCtrl");

let adminAuth = require("../middleware/AdminAuth");
let permission = require("../middleware/Permission");

// ============================
// PUBLIC ROUTES
// ============================

// جميع المنتجات
router.get("/produits", produitCtrl.getAllProduit);

// المنتجات حسب catégorie
router.get(
  "/produits/category/:category",
  produitCtrl.getProduitsByCategory
);

// produit par ID
router.get(
  "/produit/:id",
  produitCtrl.getProduitById
);

// ============================
// ADMIN PRODUCT ROUTES
// ============================

// Ajouter produit
router.post(
  "/produit",
  adminAuth.auth,
  permission.PermissionAdmin,
  produitCtrl.createProduit
);

// Modifier produit
router.put(
  "/produit/:id",
  adminAuth.auth,
  permission.PermissionAdmin,
  produitCtrl.updateProduitById
);

// Supprimer produit
router.delete(
  "/produit/:id",
  adminAuth.auth,
  permission.PermissionAdmin,
  produitCtrl.deleteProduitById
);

module.exports = router;