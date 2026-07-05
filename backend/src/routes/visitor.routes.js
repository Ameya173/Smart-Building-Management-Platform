// visitor.routes.js
const express = require("express");
const visitorRouter = express.Router();
const { createVisitor, getVisitors, getVisitorById, approveVisitor, checkIn, checkOut, rejectVisitor } = require("../controllers/visitor.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

visitorRouter.use(protect);
visitorRouter.route("/").post(createVisitor).get(getVisitors);
visitorRouter.get("/:id", getVisitorById);
visitorRouter.patch("/:id/approve", restrictTo("security_staff", "building_manager", "super_admin"), approveVisitor);
visitorRouter.patch("/:id/check-in", restrictTo("security_staff", "building_manager", "super_admin"), checkIn);
visitorRouter.patch("/:id/check-out", restrictTo("security_staff", "building_manager", "super_admin"), checkOut);
visitorRouter.patch("/:id/reject", restrictTo("security_staff", "building_manager", "super_admin"), rejectVisitor);

module.exports = visitorRouter;
