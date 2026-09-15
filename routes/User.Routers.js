const express = require("express");
const router = express.Router();

const userController = require("../Controllers/UserCtrl");

const AdminAuthentication = require("../middleware/AdminAuth");
const verifyRole = require("../middleware/Permission");
const Authentication = require("../middleware/Auth");

// ============================
// Auth User
// ============================

router.post("/user/register", userController.register);
router.post("/user/login", userController.login);

// ============================
// Admin - Users
// ============================

router.get(
  "/users",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  userController.getAllUsers
);

router.get(
  "/user/:id",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  userController.getUser
);

router.get(
  "/user/me",
  Authentication.auth,
  userController.getMe
);

router.put(
  "/user/:id",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  userController.updateUser
);

router.delete(
  "/user/:id",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  userController.deleteUser
);

// ============================
// User Cart
// ============================

router.post("/user/cart", userController.addToCart);

router.get("/user/cart/:id", userController.getCart);

router.delete("/user/cart", userController.removeFromCart);

module.exports = router;