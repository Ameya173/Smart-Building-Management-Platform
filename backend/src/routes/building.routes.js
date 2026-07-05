const express = require("express");
const router = express.Router();
const { createBuilding, getBuildings, getBuildingById, updateBuilding, deleteBuilding, assignManager, getBuildingStats } = require("../controllers/building.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.route("/").post(restrictTo("super_admin"), createBuilding).get(getBuildings);
router.get("/:id/stats", getBuildingStats);
router.route("/:id").get(getBuildingById).patch(restrictTo("super_admin", "building_manager"), updateBuilding).delete(restrictTo("super_admin"), deleteBuilding);
router.patch("/:id/assign-manager", restrictTo("super_admin"), assignManager);

module.exports = router;
