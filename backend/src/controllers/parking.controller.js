const asyncHandler = require("express-async-handler");
const ParkingSlot = require("../models/ParkingSlot");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

exports.createSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.create(req.body);
  res.status(201).json(new ApiResponse(201, slot, "Parking slot created"));
});

exports.getSlots = asyncHandler(async (req, res) => {
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isOccupied !== undefined) filter.isOccupied = req.query.isOccupied === "true";

  const slots = await ParkingSlot.find(filter).populate("occupiedBy", "name");
  const available = slots.filter((s) => !s.isOccupied).length;

  res.status(200).json(new ApiResponse(200, { slots, totalSlots: slots.length, available, occupied: slots.length - available }, "Slots fetched"));
});

exports.checkIn = asyncHandler(async (req, res) => {
  const { vehicleNumber } = req.body;
  const slot = await ParkingSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, "Slot not found");
  if (slot.isOccupied) throw new ApiError(400, "Slot already occupied");

  slot.isOccupied = true;
  slot.occupiedBy = req.user._id;
  slot.vehicleNumber = vehicleNumber;
  slot.checkedInAt = new Date();
  await slot.save();
  res.status(200).json(new ApiResponse(200, slot, "Parked successfully"));
});

exports.checkOut = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, "Slot not found");

  slot.isOccupied = false;
  slot.occupiedBy = null;
  slot.vehicleNumber = "";
  slot.checkedInAt = null;
  await slot.save();
  res.status(200).json(new ApiResponse(200, slot, "Checked out successfully"));
});

exports.deleteSlot = asyncHandler(async (req, res) => {
  await ParkingSlot.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(200).json(new ApiResponse(200, null, "Slot deleted"));
});
