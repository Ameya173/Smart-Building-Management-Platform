const express = require("express");
const router = express.Router();
const { createComplaint, getComplaints, getComplaintById, updateComplaint, deleteComplaint, getComplaintStats } = require("../controllers/complaint.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);
router.get("/stats", getComplaintStats);
router.route("/").post(createComplaint).get(getComplaints);
router.route("/:id").get(getComplaintById).patch(updateComplaint).delete(restrictTo("super_admin", "building_manager"), deleteComplaint);

module.exports = router;
