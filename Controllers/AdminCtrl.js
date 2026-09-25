const Admin = require("../models/AdminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 2 * 60 * 60 * 1000,
};

const AdminCtrl = {
  // ============================
  // ADMIN LOGIN
  // ============================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email et mot de passe requis",
          success: false,
          error: true,
        });
      }

      const findAdmin = await Admin.findOne({ email });

      if (!findAdmin) {
        return res.status(401).json({
          message: "Email incorrect",
          success: false,
          error: true,
        });
      }

      const compare = await bcrypt.compare(
        password,
        findAdmin.password
      );

      if (!compare) {
        return res.status(401).json({
          message: "Mot de passe incorrect",
          success: false,
          error: true,
        });
      }

      // ============================
      // CREATE ADMIN JWT
      // ============================

      const tokenData = {
        id: findAdmin._id.toString(),
        email: findAdmin.email,
        role: findAdmin.role,
      };

      const token = jwt.sign(
        tokenData,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "2h",
        }
      );

      // ============================
      // ADMIN COOKIE
      // ============================

      res.cookie("adminToken", token, cookieOptions);

      console.log("================================");
      console.log("🔐 ADMIN LOGIN");
      console.log("👤 ADMIN:", findAdmin.email);
      console.log("🎫 adminToken créé ✅");
      console.log("🍪 COOKIE OPTIONS:", cookieOptions);
      console.log("================================");

      return res.status(200).json({
        message: "Connexion réussie",
        data: {
          admin: {
            id: findAdmin._id,
            email: findAdmin.email,
            nom: findAdmin.nom,
            role: findAdmin.role,
          },
        },
        success: true,
        error: false,
      });

    } catch (error) {
      console.error("❌ ADMIN LOGIN ERROR:", error);

      return res.status(500).json({
        message:
          error.message ||
          "Erreur serveur lors de la connexion",
        success: false,
        error: true,
      });
    }
  },

  // ============================
  // ADMIN LOGOUT
  // ============================
  logout: async (req, res) => {
    try {
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });

      return res.status(200).json({
        message: "Déconnexion réussie",
        error: false,
        success: true,
      });

    } catch (error) {
      return res.status(500).json({
        message:
          error.message ||
          "Erreur lors de la déconnexion",
        error: true,
        success: false,
      });
    }
  },
};

module.exports = AdminCtrl;