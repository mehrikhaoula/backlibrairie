const mongoose = require("mongoose");

const ProduitSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  brand: {
    type: String,
    default: "RayArt",
  },

  category: {
    type: String,
    required: true,
  },

  imageUrl: {
    type: String,
    default: "",
  },

  price: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  discount: {
    type: Number,
    default: 0,
  },

  quantite: {
    type: Number,
    default: 200,
  },

  sourceUrl: {
    type: String,
    default: "",
  },

});

module.exports = mongoose.model("produit", ProduitSchema);