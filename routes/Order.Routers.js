const express = require("express");

const router = express.Router();

const orderController = require("../Controllers/OrderCtrl");

const Authentication = require("../middleware/Auth");
const AdminAuthentication = require("../middleware/AdminAuth");
const verifyRole = require("../middleware/Permission");

// ============================
// User Orders
// ============================

router.post(
  "/",
  Authentication.auth,
  orderController.createOrder
);

router.get(
  "/my-orders",
  Authentication.auth,
  orderController.getMyOrders
);
// ============================
// Most Ordered Products
// ============================

router.get(
  "/most-ordered",
  orderController.getMostOrderedProducts
);

// ============================
// User - Update my order
// ============================

router.put(
  "/my-orders/:id",
  Authentication.auth,
  orderController.updateMyOrder
);

router.get(
  "/:id",
  Authentication.auth,
  orderController.getOrderById
);

// ============================
// Admin Orders
// ============================

router.get(
  "/",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  orderController.getAllOrders
);

router.put(
  "/:id",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  orderController.updateOrderStatus
);

router.delete(
  "/:id",
  AdminAuthentication.auth,
  verifyRole.PermissionAdmin,
  orderController.deleteOrder
);
module.exports = router;