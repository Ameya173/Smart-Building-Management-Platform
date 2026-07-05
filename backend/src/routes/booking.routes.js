const express = require("express");
const router = express.Router();
const { createBooking, getBookings, getBookingById, cancelBooking, getRoomAvailability } = require("../controllers/booking.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);
router.get("/availability", getRoomAvailability);
router.route("/").post(createBooking).get(getBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

module.exports = router;
