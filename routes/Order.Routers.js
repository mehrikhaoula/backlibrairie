const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/OrderCtrl")
const Authentication =require ("../middleware/Auth")

router.post("/", orderController.createOrder);
router.get("/", Authentication.auth, orderController.getAllOrders);
router.get("/:id", Authentication.auth, orderController.getOrderById);
router.put("/:id", Authentication.auth, orderController.updateOrderStatus);
router.delete("/:id", Authentication.auth, orderController.deleteOrder);

module.exports = router;