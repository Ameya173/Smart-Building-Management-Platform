const express = require("express");
const router = express.Router();
const { simulateBudget } = require("../controllers/simulator.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

// Allow building managers and super admins to use the simulator
router.get("/predict", restrictTo("super_admin", "building_manager"), simulateBudget);

module.exports = router;
