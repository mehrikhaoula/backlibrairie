const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER QUI A PASSE LA COMMANDE
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // ==========================================
    // INFORMATIONS CLIENT
    // ==========================================

    customer: {
      firstName: {
        type: String,
        required: true,
      },

      lastName: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },
    },

    // ==========================================
    // ARTICLES
    // ==========================================

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "produit",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
        },
      },
    ],

    // ==========================================
    // TOTAL
    // ==========================================

    total: {
      type: Number,
      required: true,
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,

      enum: [
        "En attente",
        "Confirmée",
        "Expédiée",
        "Livrée",
        "Annulée",
      ],

      default: "En attente",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  OrderSchema
);