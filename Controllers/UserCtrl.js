const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const SECRET = process.env.ACCESS_TOKEN_SECRET;

// ============================
// EMAIL TRANSPORTER
// ============================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

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

      if (!firstname || !lastname || !password) {
        return res.status(400).json({
          message: "Prénom, nom et mot de passe sont obligatoires.",
        });
      }

      if (!email && !phone) {
        return res.status(400).json({
          message:
            "Veuillez saisir un email ou un numéro de téléphone.",
        });
      }

      // Vérifier email
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

      // Vérifier téléphone
      if (phone) {
        const phoneExists = await User.findOne({
          phone: phone.trim(),
        });

        if (phoneExists) {
          return res.status(400).json({
            message: "Ce numéro de téléphone est déjà utilisé.",
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
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
    // ============================
    // CREATE USER JWT
    // ============================
       const token = jwt.sign(
  { id: newUser._id,},
  SECRET,
  { expiresIn: "1d", }
);

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true";

res.cookie("token", token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 2 * 60 * 60 * 1000,
  path: "/",
});

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

      if (!identifier || !password) {
        return res.status(400).json({
          message:
            "Veuillez saisir votre email/téléphone et votre mot de passe.",
        });
      }

      const value = identifier.trim();

      // Recherche Email OU Téléphone
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

      // Google account
      if (!user.password) {
        return res.status(400).json({
          message:
            "Ce compte utilise Google. Veuillez vous connecter avec Google.",
        });
      }

      // Vérifier password
      const isMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Mot de passe incorrect.",
        });
      }

      // JWT
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
// COOKIE AUTHENTIFICATION
// ============================

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true";

res.cookie("token", token, {
  httpOnly: true,

  secure: isProduction,

  sameSite: isProduction ? "none" : "lax",

  maxAge: 2 * 60 * 60 * 1000,

  path: "/",
});

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

  // ============================
  // FORGOT PASSWORD
  // ============================
  forgotPassword: async (req, res) => {
  try {
    console.log("========== FORGOT PASSWORD ==========");
    console.log("BODY:", req.body);

      const { method, identifier } = req.body;

      if (!method || !identifier) {
        return res.status(400).json({
          success: false,
          message: "Veuillez saisir votre email.",
        });
      }

      // Pour l'instant : Email uniquement
      if (method !== "email") {
        return res.status(400).json({
          success: false,
          message:
            "La récupération par téléphone sera disponible prochainement.",
        });
      }

      const email = identifier.trim().toLowerCase();

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Aucun compte trouvé avec cet email.",
        });
      }

      // Compte Google
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message:
            "Ce compte utilise Google. Veuillez vous connecter avec Google.",
        });
      }

      // Générer un code à 6 chiffres
      const code = crypto
        .randomInt(100000, 1000000)
        .toString();

      // Hash du code avant stockage
      const hashedCode = await bcrypt.hash(code, 10);

      // Code valable 10 minutes
      user.resetPasswordCode = hashedCode;
      user.resetPasswordExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user.save();

      // Envoyer l'email
      await transporter.sendMail({
        from: `"Librairie Benzarti" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject:
          "Code de réinitialisation de votre mot de passe",
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #f8f6f3;
            border-radius: 12px;
          ">

            <h2 style="color: #8a6a45;">
              Librairie Benzarti
            </h2>

            <p>
              Bonjour ${user.firstname},
            </p>

            <p>
              Vous avez demandé la réinitialisation de votre mot de passe.
            </p>

            <p>
              Votre code de vérification est :
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              margin: 20px 0;
              background: white;
              border-radius: 10px;
              color: #6f5335;
            ">
              ${code}
            </div>

            <p>
              Ce code est valable pendant
              <strong>10 minutes</strong>.
            </p>

            <p>
              Si vous n'êtes pas à l'origine de cette demande,
              vous pouvez simplement ignorer cet email.
            </p>

            <hr />

            <p style="font-size: 12px; color: #777;">
              Librairie Benzarti Monastir
            </p>

          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message:
          "Un code de vérification a été envoyé à votre adresse email.",
      });
    } catch (err) {
  console.error("========== FORGOT PASSWORD ERROR ==========");
  console.error(err);
  console.error("MESSAGE:", err.message);
  console.error("STACK:", err.stack);

  return res.status(500).json({
    success: false,
    message: err.message,
  });
}
  },

  // ============================
  // VERIFY RESET CODE
  // ============================
  verifyResetCode: async (req, res) => {
    try {
      const {
        method,
        identifier,
        code,
      } = req.body;

      if (!method || !identifier || !code) {
        return res.status(400).json({
          success: false,
          message: "Veuillez remplir tous les champs.",
        });
      }

      if (method !== "email") {
        return res.status(400).json({
          success: false,
          message:
            "La récupération par téléphone sera disponible prochainement.",
        });
      }

      const email = identifier.trim().toLowerCase();

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Aucun compte trouvé avec cet email.",
        });
      }

      // Vérifier expiration
      if (
        !user.resetPasswordExpires ||
        user.resetPasswordExpires.getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Le code a expiré. Veuillez demander un nouveau code.",
        });
      }

      if (!user.resetPasswordCode) {
        return res.status(400).json({
          success: false,
          message:
            "Aucun code de vérification actif.",
        });
      }

      // Vérifier le code
      const isValid = await bcrypt.compare(
        code.toString().trim(),
        user.resetPasswordCode
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message:
            "Code de vérification incorrect.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Code vérifié avec succès.",
      });
    } catch (err) {
      console.error(
        "VERIFY RESET CODE ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la vérification du code.",
      });
    }
  },

  // ============================
  // RESET PASSWORD
  // ============================
  resetPassword: async (req, res) => {
    try {
      const {
        method,
        identifier,
        code,
        newPassword,
      } = req.body;

      if (
        !method ||
        !identifier ||
        !code ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Veuillez remplir tous les champs.",
        });
      }

      if (method !== "email") {
        return res.status(400).json({
          success: false,
          message:
            "La récupération par téléphone sera disponible prochainement.",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Le nouveau mot de passe doit contenir au moins 6 caractères.",
        });
      }

      const email = identifier.trim().toLowerCase();

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Aucun compte trouvé avec cet email.",
        });
      }

      // Vérifier expiration
      if (
        !user.resetPasswordExpires ||
        user.resetPasswordExpires.getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Le code a expiré. Veuillez recommencer.",
        });
      }

      if (!user.resetPasswordCode) {
        return res.status(400).json({
          success: false,
          message:
            "Aucun code de vérification actif.",
        });
      }

      // Vérifier le code une dernière fois
      const isValid = await bcrypt.compare(
        code.toString().trim(),
        user.resetPasswordCode
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message:
            "Code de vérification incorrect.",
        });
      }

      // Nouveau mot de passe
      user.password = await bcrypt.hash(
        newPassword,
        10
      );

      // Invalider le code
      user.resetPasswordCode = null;
      user.resetPasswordExpires = null;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Votre mot de passe a été réinitialisé avec succès.",
      });
    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la réinitialisation du mot de passe.",
      });
    }
  },

  // ============================
  // Get All Users
  // ============================
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find().select("-password");

      res.json(user);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Get User by ID
  // ============================
  getUser: async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      ).select("-password");

      res.json(user);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Update User
  // ============================
  updateUser: async (req, res) => {
    try {
      const updated =
        await User.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
          }
        );

      res.json(updated);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Add to Cart
  // ============================
  addToCart: async (req, res) => {
    try {
      const {
        userId,
        productId,
        quantity,
      } = req.body;

      const user =
        await User.findById(userId);

      const itemIndex =
        user.cart.findIndex(
          (item) =>
            item.productId.toString() ===
            productId
        );

      if (itemIndex > -1) {
        user.cart[itemIndex].quantity +=
          quantity;
      } else {
        user.cart.push({
          productId,
          quantity,
        });
      }

      await user.save();

      res.json(user.cart);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Get Cart
  // ============================
  getCart: async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        ).populate("cart.productId");

      res.json(user.cart);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Get Me
  // ============================
  getMe: async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user
        ).select("-password");

      console.log(user);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable.",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      console.error(
        "GET ME ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Erreur serveur.",
      });
    }
  },

  // ============================
  // Remove from Cart
  // ============================
  removeFromCart: async (req, res) => {
    try {
      const {
        userId,
        productId,
      } = req.body;

      const user =
        await User.findById(userId);

      user.cart =
        user.cart.filter(
          (item) =>
            item.productId.toString() !==
            productId
        );

      await user.save();

      res.json(user.cart);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },

  // ============================
  // Delete User
  // ============================
  deleteUser: async (req, res) => {
    try {
      const deletedUser =
        await User.findByIdAndDelete(
          req.params.id
        );

      if (!deletedUser) {
        return res.status(404).json({
          message:
            "Utilisateur introuvable",
          success: false,
        });
      }

      res.status(200).json({
        message:
          "Utilisateur supprimé avec succès",
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