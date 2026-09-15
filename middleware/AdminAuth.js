const jwt = require("jsonwebtoken");

const AdminAuthentication = {

  auth: async (req, res, next) => {
  try {

    console.log("================================");
    console.log("🔐 ADMIN AUTH");
    console.log("🌐 HOST:", req.headers.host);
    console.log("🍪 RAW COOKIE:", req.headers.cookie);
    console.log("🍪 PARSED COOKIES:", req.cookies);

    const token = req.cookies?.adminToken;

    console.log(
      "🔑 ADMIN TOKEN:",
      token ? "✅ موجود" : "❌ غير موجود"
    );

    if (!token) {
      return res.status(401).json({
        message: "Admin non connecté.",
        error: true,
        success: false,
      });
    }

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {

        if (err) {
          console.log("❌ ADMIN JWT ERROR:", err.message);

          return res.status(401).json({
            message: "Session admin expirée ou token invalide.",
            error: true,
            success: false,
          });
        }

        console.log("✅ ADMIN JWT:", decoded);

        const adminId = decoded?.id;

        if (!adminId) {
          return res.status(401).json({
            message: "Admin invalide.",
            error: true,
            success: false,
          });
        }

        req.admin = adminId;

        next();
      }
    );

  } catch (error) {
    console.error("❌ ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      message: error.message || "Erreur serveur",
      error: true,
      success: false,
    });
  }
},
};

module.exports = AdminAuthentication;