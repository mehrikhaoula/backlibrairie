const adminModel = require("../models/AdminModel");

const verifyRole = {

  PermissionAdmin: async (req, res, next) => {

    try {

      const admin = await adminModel.findById(req.admin);

      if (!admin) {
        return res.status(403).json({
          msg: "Admin access denied.",
        });
      }

      next();

    } catch (error) {

      return res.status(500).json({
        msg: error.message,
      });

    }
  },
};

module.exports = verifyRole;