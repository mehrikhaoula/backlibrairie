const jwt = require("jsonwebtoken");

const Authentication = {
  auth: (req, res, next) => {
    try {
      const token = req.cookies?.token;

      console.log("\n================ USER AUTH ================");
      console.log(
        "🍪 TOKEN:",
        token ? "EXISTE ✅" : "ABSENT ❌"
      );

      if (!token) {
        console.log("❌ Aucun token dans les cookies");

        return res.status(401).json({
          message: "Veuillez vous connecter.",
          error: true,
          success: false,
        });
      }

      console.log("🔑 Vérification du token...");

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );

      console.log("✅ TOKEN VALIDE");
      console.log("👤 USER ID:", decoded.id);

      if (!decoded.id) {
        console.log("❌ ID utilisateur absent du token");

        return res.status(401).json({
          message: "Utilisateur invalide.",
          error: true,
          success: false,
        });
      }

      req.user = decoded.id;

      console.log("✅ req.user =", req.user);
      console.log("===========================================\n");

      next();

    } catch (error) {
      console.error("❌ JWT ERROR");
      console.error("NAME:", error.name);
      console.error("MESSAGE:", error.message);

      return res.status(401).json({
        message: "Session expirée ou token invalide.",
        error: true,
        success: false,
      });
    }
  },
};

module.exports = Authentication;