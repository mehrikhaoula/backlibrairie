const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

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

    total: {
      type: Number,
      required: true,
    },

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

    paymentStatus: {
      type: String,
      default: "En attente",
    },
    paymentMethod: {
      type: String,
      default: "Espèces",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Order", OrderSchema);