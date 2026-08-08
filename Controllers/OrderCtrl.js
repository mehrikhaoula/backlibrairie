const Order = require("../models/OrderModel");
const sendTelegramMessage = require("../utils/Telegram");
const orderCtrl = {
  // Create Order
 createOrder: async (req, res) => {
  try {
    const {
      customer,
      items,
      total
    } = req.body;

    if (
      !customer ||
      !customer.firstName ||
      !customer.lastName ||
      !customer.phone ||
      !customer.address ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Toutes les informations sont obligatoires"
      });
    }
    const newOrder = new Order({
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address
      },
      items,
      total
    });
    await newOrder.save();

    // Telegram notification
    await sendTelegramMessage(`
📚 Nouvelle commande

👤 Client:
${newOrder.customer.firstName} ${newOrder.customer.lastName}

📞 Téléphone:
${newOrder.customer.phone}

📍 Adresse:
${newOrder.customer.address}

💰 Total:
${newOrder.total} DT
🛒 Nombre produits:
${newOrder.items.length}
`);
    
    res.status(201).json({
      message: "Commande créée avec succès",
      order: newOrder
    });
  } catch(err){
    res.status(500).json({
      error: err.message
    });
  }
},

  // Get all orders
  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get order by ID
  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

if (!order)
  return res.status(404).json({
    message: "Order not found",
  });

res.json(order);
    } catch (err) {
  console.log(err);
  res.status(400).json({
    error: err.message
  });
}
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      message: "Status updated successfully",
      order: updatedOrder,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
},

  // Delete order
  deleteOrder: async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ message: "Order deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = orderCtrl;