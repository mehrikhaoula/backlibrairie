
let router = require("express").Router();
let categorieCtrl = require("../Controllers/CatgCtrl");

let adminAuth = require("../middleware/AdminAuth");
let permission = require("../middleware/Permission");

// ============================
// ADMIN CATEGORY ROUTES
// ============================

router.get(
  "/categories",
  adminAuth.auth,
  permission.PermissionAdmin,
  categorieCtrl.getAllCatg
);

router.post(
  "/categorie",
  adminAuth.auth,
  permission.PermissionAdmin,
  categorieCtrl.ajouterCatg
);

router.put(
  "/categorie/:id",
  adminAuth.auth,
  permission.PermissionAdmin,
  categorieCtrl.modifierCatg
);

router.delete(
  "/categorie/:id",
  adminAuth.auth,
  permission.PermissionAdmin,
  categorieCtrl.supprimercatg
);

router.get(
  "/categorie/:id",
  adminAuth.auth,
  permission.PermissionAdmin,
  categorieCtrl.getCategById
);

// ============================
// PUBLIC ROUTES
// ============================

router.delete(
  "/delettype",
  categorieCtrl.supprimerType
);

router.get(
  "/categorie",
  categorieCtrl.getCategorie
);

router.get(
  "/nomcategorie",
  categorieCtrl.getCategByNom
);

router.get(
  "/typecategorie",
  categorieCtrl.getCategByType
);

module.exports = router;




