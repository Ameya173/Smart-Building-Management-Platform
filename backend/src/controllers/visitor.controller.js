const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Visitor = require("../models/Visitor");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

exports.createVisitor = asyncHandler(async (req, res) => {
  const passCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const building = req.body.building || req.user.building;
  if (!building) throw new ApiError(400, "Building is required");

  const hostUser = req.body.hostUser || req.user._id;
  const host = await User.findById(hostUser);
  if (!host) throw new ApiError(404, "Host user not found");
  if (host.building && String(host.building) !== String(building)) throw new ApiError(400, "Host user belongs to another building");

  const visitor = await Visitor.create({ ...req.body, building, passCode, hostUser });
  res.status(201).json(new ApiResponse(201, visitor, "Visitor registered"));
});

exports.getVisitors = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const d = new Date(req.query.date);
    filter.createdAt = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  }

  const [visitors, total] = await Promise.all([
    Visitor.find(filter).populate("hostUser", "name email").populate("approvedBy", "name").sort(sort).skip(skip).limit(limit),
    Visitor.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(visitors, total, page, limit), "Visitors fetched"));
});

exports.getVisitorById = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id).populate("hostUser", "name email phone");
  if (!visitor) throw new ApiError(404, "Visitor not found");
  res.status(200).json(new ApiResponse(200, visitor, "Visitor fetched"));
});

exports.approveVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findByIdAndUpdate(
    req.params.id,
    { status: "approved", approvedBy: req.user._id },
    { new: true }
  );
  if (!visitor) throw new ApiError(404, "Visitor not found");
  res.status(200).json(new ApiResponse(200, visitor, "Visitor approved"));
});

exports.checkIn = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) throw new ApiError(404, "Visitor not found");
  if (visitor.status !== "approved") throw new ApiError(400, "Visitor not approved yet");

  visitor.status = "checked_in";
  visitor.checkIn = new Date();
  await visitor.save();
  res.status(200).json(new ApiResponse(200, visitor, "Visitor checked in"));
});

exports.checkOut = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) throw new ApiError(404, "Visitor not found");
  visitor.status = "checked_out";
  visitor.checkOut = new Date();
  await visitor.save();
  res.status(200).json(new ApiResponse(200, visitor, "Visitor checked out"));
});

exports.rejectVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  if (!visitor) throw new ApiError(404, "Visitor not found");
  res.status(200).json(new ApiResponse(200, visitor, "Visitor rejected"));
});
