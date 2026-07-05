const express = require("express");
const router = express.Router();
const { createSlot, getSlots, checkIn, checkOut, deleteSlot } = require("../controllers/parking.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.route("/").post(restrictTo("super_admin", "building_manager"), createSlot).get(getSlots);
router.patch("/:id/check-in", checkIn);
router.patch("/:id/check-out", checkOut);
router.delete("/:id", restrictTo("super_admin", "building_manager"), deleteSlot);

module.exports = router;
