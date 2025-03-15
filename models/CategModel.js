let mongoose = require("mongoose");

let categorieShema = new mongoose.Schema({
  NomCategorie: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    unique: true
  },
});

module.exports =mongoose.model('categorie', categorieShema);
