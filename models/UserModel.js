const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    resetPasswordCode: {
  type: String,
  default: null,
},

resetPasswordExpires: {
  type: Date,
  default: null,
},

    // // Pour Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "produit",
        },

        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", UserSchema);