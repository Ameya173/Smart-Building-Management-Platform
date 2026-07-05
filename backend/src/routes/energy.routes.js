const express = require("express");
const router = express.Router();
const { addEnergyRecord, getEnergyRecords, getEnergySummary } = require("../controllers/energy.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.get("/summary", getEnergySummary);
router.route("/").post(restrictTo("super_admin", "building_manager"), addEnergyRecord).get(getEnergyRecords);

module.exports = router;
