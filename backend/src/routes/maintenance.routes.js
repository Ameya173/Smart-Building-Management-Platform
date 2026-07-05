const express = require("express");
const router = express.Router();
const { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getMaintenanceStats } = require("../controllers/maintenance.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.get("/stats", getMaintenanceStats);
router.route("/").post(restrictTo("super_admin", "building_manager"), createTicket).get(getTickets);
router.route("/:id").get(getTicketById).patch(updateTicket).delete(restrictTo("super_admin", "building_manager"), deleteTicket);

module.exports = router;
