const express = require("express");
const router = express.Router();

router.use("/auth",          require("./auth.routes"));
router.use("/buildings",     require("./building.routes"));
router.use("/assets",        require("./asset.routes"));
router.use("/maintenance",   require("./maintenance.routes"));
router.use("/complaints",    require("./complaint.routes"));
router.use("/visitors",      require("./visitor.routes"));
router.use("/parking",       require("./parking.routes"));
router.use("/bookings",      require("./booking.routes"));
router.use("/rooms",         require("./room.routes"));
router.use("/energy",        require("./energy.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/dashboard",     require("./dashboard.routes"));
router.use("/security",      require("./security.routes"));
router.use("/simulator",     require("./simulator.routes"));

module.exports = router;
