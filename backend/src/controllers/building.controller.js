const asyncHandler = require("express-async-handler");
const Building = require("../models/Building");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

exports.createBuilding = asyncHandler(async (req, res) => {
  const building = await Building.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, building, "Building created"));
});

exports.getBuildings = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
  if (req.user.role !== "super_admin" && req.user.building) filter._id = req.user.building;

  const [buildings, total] = await Promise.all([
    Building.find(filter).populate("manager", "name email phone").sort(sort).skip(skip).limit(limit),
    Building.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(buildings, total, page, limit), "Buildings fetched"));
});

exports.getBuildingById = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id).populate("manager", "name email phone");
  if (!building) throw new ApiError(404, "Building not found");
  res.status(200).json(new ApiResponse(200, building, "Building fetched"));
});

exports.updateBuilding = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id);
  if (!building) throw new ApiError(404, "Building not found");
  if (req.user.role === "building_manager" && String(building._id) !== String(req.user.building))
    throw new ApiError(403, "Not authorized");
  Object.assign(building, req.body);
  await building.save();
  res.status(200).json(new ApiResponse(200, building, "Building updated"));
});

exports.deleteBuilding = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id);
  if (!building) throw new ApiError(404, "Building not found");
  building.isActive = false;
  await building.save();
  res.status(200).json(new ApiResponse(200, null, "Building deactivated"));
});

exports.assignManager = asyncHandler(async (req, res) => {
  const { managerId } = req.body;
  const [building, manager] = await Promise.all([
    Building.findById(req.params.id),
    User.findById(managerId),
  ]);
  if (!building) throw new ApiError(404, "Building not found");
  if (!manager) throw new ApiError(404, "User not found");

  // If this building already has a manager, unlink them
  if (building.manager && building.manager.toString() !== managerId) {
    await User.findByIdAndUpdate(building.manager, { building: null });
  }

  // If this user was already managing another building, remove them from that building
  if (manager.building && manager.building.toString() !== String(building._id)) {
    await Building.findByIdAndUpdate(manager.building, { manager: null });
  }

  manager.role = "building_manager";
  manager.building = building._id;
  await manager.save();
  building.manager = manager._id;
  await building.save();

  const populated = await Building.findById(building._id).populate("manager", "name email phone");
  res.status(200).json(new ApiResponse(200, populated, "Manager assigned"));
});


exports.getBuildingStats = asyncHandler(async (req, res) => {
  const Asset = require("../models/Asset");
  const MaintenanceTicket = require("../models/MaintenanceTicket");
  const Complaint = require("../models/Complaint");

  const bId = req.params.id;
  const [totalAssets, openTickets, openComplaints, building] = await Promise.all([
    Asset.countDocuments({ building: bId, isActive: { $ne: false } }),
    MaintenanceTicket.countDocuments({ building: bId, isActive: { $ne: false }, status: { $in: ["open", "in_progress"] } }),
    Complaint.countDocuments({ building: bId, isActive: { $ne: false }, status: { $in: ["pending", "in_progress"] } }),
    Building.findById(bId),
  ]);
  if (!building) throw new ApiError(404, "Building not found");

  res.status(200).json(new ApiResponse(200, {
    building: building.name,
    totalAssets, openTickets, openComplaints,
    efficiencyScore: building.efficiencyScore,
  }, "Stats fetched"));
});
