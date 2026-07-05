const express = require("express");
const router = express.Router();
const { createAsset, getAssets, getAssetById, updateAsset, deleteAsset, getAssetsByBuilding, getAssetStats, getAssetPassport } = require("../controllers/asset.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.get("/stats", getAssetStats);
router.get("/building/:buildingId", getAssetsByBuilding);
router.route("/").post(restrictTo("super_admin", "building_manager"), createAsset).get(getAssets);
router.get("/:id/passport", getAssetPassport);
router.route("/:id").get(getAssetById).patch(restrictTo("super_admin", "building_manager"), updateAsset).delete(restrictTo("super_admin", "building_manager"), deleteAsset);

module.exports = router;
