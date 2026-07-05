const express = require("express");
const router = express.Router();
const { createRoom, getRooms, updateRoom, deleteRoom } = require("../controllers/room.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.route("/")
  .get(getRooms)
  .post(restrictTo("super_admin", "building_manager"), createRoom);
router.route("/:id")
  .patch(restrictTo("super_admin", "building_manager"), updateRoom)
  .delete(restrictTo("super_admin", "building_manager"), deleteRoom);

module.exports = router;
