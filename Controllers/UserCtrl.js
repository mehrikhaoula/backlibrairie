const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.ACCESS_TOKEN_SECRET; // Use environment variable in production

const userCtrl = {
  // ============================
// Register
// ============================
register: async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      password,
    } = req.body;

    console.log("REGISTER BODY:", req.body);

    // ============================
    // Vérifications
    // ============================

    if (!firstname || !lastname || !password) {
      return res.status(400).json({
        message:
          "Prénom, nom et mot de passe sont obligatoires.",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        message:
          "Veuillez saisir un email ou un numéro de téléphone.",
      });
    }

    // ============================
    // Vérifier email
    // ============================

    if (email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Cet email est déjà utilisé.",
        });
      }
    }

    // ============================
    // Vérifier téléphone
    // ============================

    if (phone) {
      const phoneExists = await User.findOne({
        phone: phone.trim(),
      });

      if (phoneExists) {
        return res.status(400).json({
          message:
            "Ce numéro de téléphone est déjà utilisé.",
        });
      }
    }

    // ============================
    // Hash password
    // ============================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ============================
    // Create user
    // ============================

    const newUser = new User({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email
        ? email.toLowerCase().trim()
        : undefined,
      phone: phone
        ? phone.trim()
        : undefined,
      password: hashedPassword,
      provider: "local",
    });

    await newUser.save();

    
    return res.status(201).json({
      message: "Compte créé avec succès.",
      success: true,
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        phone: newUser.phone,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
},

// ============================
// Login
// ============================
login: async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    // ============================
    // Vérification
    // ============================

    if (!identifier || !password) {
      return res.status(400).json({
        message:
          "Veuillez saisir votre email/téléphone et votre mot de passe.",
      });
    }

    const value = identifier.trim();

    // ============================
    // Recherche Email OU Téléphone
    // ============================

    const user = await User.findOne({
      $or: [
        {
          email: value.toLowerCase(),
        },
        {
          phone: value,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message:
          "Aucun compte trouvé avec cet email ou numéro.",
      });
    }

    // ============================
    // Google account
    // ============================

    if (!user.password) {
      return res.status(400).json({
        message:
          "Ce compte utilise Google. Veuillez vous connecter avec Google.",
      });
    }

    // ============================
    // Vérifier password
    // ============================

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Mot de passe incorrect.",
      });
    }

    // ============================
    // JWT
    // ============================

    const token = jwt.sign(
      {
        id: user._id,
      },
      SECRET,
      {
        expiresIn: "1d",
      }
    );

    // ============================
    // Cookie
    // ============================

    res.cookie("token", token, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
});

    // ============================
    // Response
    // ============================

    return res.status(200).json({
      message: "Connexion réussie.",
      success: true,

      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
},

  // Get user by ID
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find().select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get user by ID
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Update user info
  updateUser: async (req, res) => {
    try {
      const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Add to Cart
  addToCart: async (req, res) => {
    try {
      const { userId, productId, quantity } = req.body;

      const user = await User.findById(userId);
      const itemIndex = user.cart.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        user.cart[itemIndex].quantity += quantity;
      } else {
        user.cart.push({ productId, quantity });
      }

      await user.save();
      res.json(user.cart);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get Cart
  getCart: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).populate(
        "cart.productId"
      );
      res.json(user.cart);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  
  getMe: async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
console.log (user)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GET ME ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur.",
    });
  }
},

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { userId, productId } = req.body;

      const user = await User.findById(userId);
      user.cart = user.cart.filter(
        (item) => item.productId.toString() !== productId
      );
      await user.save();

      res.json(user.cart);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  deleteUser: async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
        success: false,
      });
    }

    res.status(200).json({
      message: "Utilisateur supprimé avec succès",
      success: true,
      data: deletedUser,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
      success: false,
    });
  }
},
};
module.exports = userCtrl;