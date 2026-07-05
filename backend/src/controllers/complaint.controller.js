const asyncHandler = require("express-async-handler");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

// Helper: resolve building ID from body OR logged-in user
const resolveBuilding = (req) => {
  const b = req.body.building || req.user.building;
  if (!b) throw new ApiError(400, "No building associated. Ask your admin to assign you to a building.");
  return typeof b === "object" ? b._id || b : b;
};

exports.createComplaint = asyncHandler(async (req, res) => {
  const building = resolveBuilding(req);
  const complaint = await Complaint.create({
    ...req.body,
    building,
    raisedBy: req.user._id,
  });
  res.status(201).json(new ApiResponse(201, complaint, "Complaint submitted"));
});

exports.getComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  else if (req.user.building) filter.building = req.user.building;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.user.role === "resident") filter.raisedBy = req.user._id;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate("raisedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("building", "name")
      .sort(sort).skip(skip).limit(limit),
    Complaint.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(complaints, total, page, limit), "Complaints fetched"));
});

exports.getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("raisedBy", "name email phone")
    .populate("assignedTo", "name email")
    .populate("building", "name")
    .populate("floor", "name floorNumber")
    .populate("room", "name roomNumber");
  if (!complaint) throw new ApiError(404, "Complaint not found");
  res.status(200).json(new ApiResponse(200, complaint, "Complaint fetched"));
});

exports.updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "Complaint not found");
  if (req.user.role === "resident" && String(complaint.raisedBy) !== String(req.user._id))
    throw new ApiError(403, "Not authorized");

  Object.assign(complaint, req.body);
  if (req.body.status === "resolved") {
    complaint.resolvedAt = new Date();
    await Notification.create({
      recipient: complaint.raisedBy,
      building: complaint.building,
      type: "complaint",
      title: "Complaint Resolved",
      message: `Your complaint "${complaint.title}" has been resolved.`,
    });
  }
  await complaint.save();
  res.status(200).json(new ApiResponse(200, complaint, "Complaint updated"));
});

exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!complaint) throw new ApiError(404, "Complaint not found");
  res.status(200).json(new ApiResponse(200, null, "Complaint closed"));
});

exports.getComplaintStats = asyncHandler(async (req, res) => {
  const buildingId = req.query.building || req.user.building;
  const filter = buildingId ? { building: buildingId, isActive: { $ne: false } } : { isActive: { $ne: false } };
  const byStatus = await Complaint.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byCategory = await Complaint.aggregate([
    { $match: filter },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  res.status(200).json(new ApiResponse(200, { byStatus, byCategory }, "Stats fetched"));
});
