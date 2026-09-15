const Order = require("../models/OrderModel");
const sendTelegramMessage = require("../utils/Telegram");

const orderCtrl = {

  // ============================
  // Create Order
  // ============================
  createOrder: async (req, res) => {
    try {
      const {
        customer,
        items,
        total
      } = req.body;

      // Vérification
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

      // ============================
      // Création de la commande
      // ============================

      const newOrder = new Order({
  user: req.user,

  customer: {
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
  },

  items,

  total
});

      await newOrder.save();


      // ============================
      // Telegram notification
      // ============================

      let telegramMessage = `
🛒 *NOUVELLE COMMANDE*

━━━━━━━━━━━━━━━━━━

👤 *CLIENT*

Nom : ${newOrder.customer.firstName} ${newOrder.customer.lastName}

📞 Téléphone :
${newOrder.customer.phone}

📍 Adresse :
${newOrder.customer.address}

━━━━━━━━━━━━━━━━━━

📦 *DÉTAIL DE LA COMMANDE*
`;


      // ============================
      // Articles
      // ============================

      newOrder.items.forEach((item, index) => {

        const quantity = item.quantity || 1;
        const price = Number(item.price) || 0;

        const subtotal = price * quantity;

        telegramMessage += `

${index + 1}. 📚 *${item.name}*

   🔢 Quantité : ${quantity}

   💰 Prix unitaire : ${price.toFixed(2)} DT

   💵 Sous-total : ${subtotal.toFixed(2)} DT
`;
      });


      // ============================
      // Total
      // ============================

      telegramMessage += `

━━━━━━━━━━━━━━━━━━

💳 *TOTAL : ${Number(newOrder.total).toFixed(2)} DT*

📦 Nombre d'articles :
${newOrder.items.length}

━━━━━━━━━━━━━━━━━━

✅ *Commande reçue avec succès*
`;


      // Envoi Telegram
      await sendTelegramMessage(telegramMessage);


      // ============================
      // Response
      // ============================

      res.status(201).json({
        message: "Commande créée avec succès",
        order: newOrder
      });

    } catch (err) {

      console.error("❌ Erreur création commande :", err);

      res.status(500).json({
        error: err.message
      });
    }
  },

  // ============================
// Get most ordered products
// ============================

getMostOrderedProducts: async (req, res) => {
  try {
    // ==========================================
    // Statuts considérés comme commandes validées
    // ==========================================

    const validStatuses = [
      "Confirmée",
      "Expédiée",
      "Livrée",
    ];

    // ==========================================
    // Agrégation MongoDB
    // ==========================================

    const mostOrdered = await Order.aggregate([
      // 1️⃣ Garder uniquement les commandes validées
      {
        $match: {
          status: {
            $in: validStatuses,
          },
        },
      },

      // 2️⃣ Transformer items[] en documents séparés
      {
        $unwind: "$items",
      },

      // 3️⃣ Grouper par produit
      {
        $group: {
          _id: "$items.productId",

          totalOrdered: {
            $sum: "$items.quantity",
          },
        },
      },

      // 4️⃣ Trier du plus commandé au moins commandé
      {
        $sort: {
          totalOrdered: -1,
        },
      },

      // 5️⃣ Garder les 10 premiers
      {
        $limit: 10,
      },
    ]);

    // ==========================================
    // Aucun résultat
    // ==========================================

    if (mostOrdered.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // ==========================================
    // Récupérer les vrais produits
    // ==========================================

    const productIds = mostOrdered.map(
      (item) => item._id
    );

    // Le model "product" existe déjà
    // puisque OrderSchema utilise ref: "product"
    const Product = require("mongoose").model("product");

    const products = await Product.find({
      _id: {
        $in: productIds,
      },
    });

    // ==========================================
    // Garder l'ordre du classement
    // ==========================================

    const rankedProducts = mostOrdered
      .map((orderedProduct) => {
        const product = products.find(
          (p) =>
            p._id.toString() ===
            orderedProduct._id.toString()
        );

        if (!product) {
          return null;
        }

        return {
          ...product.toObject(),

          // Nombre total commandé
          totalOrdered:
            orderedProduct.totalOrdered,
        };
      })
      .filter(Boolean);

    // ==========================================
    // Response
    // ==========================================

    res.json({
      success: true,
      data: rankedProducts,
    });

  } catch (err) {
    console.error(
      "❌ Erreur récupération produits les plus commandés :",
      err
    );

    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des produits les plus commandés.",
      error: err.message,
    });
  }
},

  // ============================
  // Get all orders
  // ============================

  getAllOrders: async (req, res) => {
    try {

      const orders = await Order.find();

      res.json(orders);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }
  },

  // ============================
// Get my orders
// ============================

getMyOrders: async (req, res) => {
  try {

    const orders = await Order.find({
      user: req.user,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (err) {

    console.error(
      "❌ Erreur récupération mes commandes :",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
},

// ============================
// Update my order
// Client can modify ONLY
// orders that are still pending
// ============================

updateMyOrder: async (req, res) => {
  try {
    const { items } = req.body;

    // ============================
    // Vérification des articles
    // ============================

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "La commande doit contenir au moins un article.",
      });
    }

    // ============================
    // Récupérer uniquement
    // la commande du client connecté
    // ============================

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user,
    });

    if (!order) {
      return res.status(404).json({
        message: "Commande introuvable.",
      });
    }

    // ============================
    // Vérifier le statut
    // ============================

    if (order.status !== "En attente") {
      return res.status(400).json({
        message:
          "Cette commande est déjà confirmée et ne peut plus être modifiée.",
      });
    }

    // ============================
    // Nettoyage des articles
    // ============================

    const cleanedItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    // ============================
    // Vérification quantité
    // ============================

    const invalidItem = cleanedItems.find(
      (item) =>
        !item.productId ||
        !item.name ||
        !Number.isFinite(item.quantity) ||
        item.quantity < 1 ||
        !Number.isFinite(item.price) ||
        item.price < 0
    );

    if (invalidItem) {
      return res.status(400).json({
        message: "Les informations des articles sont invalides.",
      });
    }

    // ============================
    // Recalcul du total
    // IMPORTANT :
    // on ne fait pas confiance
    // au total envoyé par le frontend
    // ============================

    const total = cleanedItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    // ============================
    // Mise à jour
    // ============================

    order.items = cleanedItems;
    order.total = Number(total.toFixed(2));

    await order.save();

    // ============================
    // Response
    // ============================

    res.json({
      message: "Commande modifiée avec succès.",
      order,
    });
  } catch (err) {
    console.error(
      "❌ Erreur modification commande :",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
},

  // ============================
  // Get order by ID
  // ============================

  getOrderById: async (req, res) => {
    try {

      const order = await Order.findOne({
  _id: req.params.id,
  user: req.user,
});

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      res.json(order);

    } catch (err) {

      console.log(err);

      res.status(400).json({
        error: err.message
      });

    }
  },


  // ============================
  // Update order status
  // ============================

  updateOrderStatus: async (req, res) => {
    try {

      const { status } = req.body;

      const updatedOrder =
        await Order.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      res.json({
        message: "Status updated successfully",
        order: updatedOrder
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }
  },


  // ============================
  // Delete order
  // ============================

  deleteOrder: async (req, res) => {
    try {

      await Order.findByIdAndDelete(req.params.id);

      res.json({
        message: "Order deleted"
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }
  }

};


module.exports = orderCtrl;