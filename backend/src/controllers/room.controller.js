const asyncHandler = require("express-async-handler");
const Room = require("../models/Room");
const Floor = require("../models/Floor");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

const resolveBuilding = (req) => {
  const building = req.body.building || req.query.building || req.user.building;
  if (!building) throw new ApiError(400, "Building is required");
  return building;
};

exports.createRoom = asyncHandler(async (req, res) => {
  const building = resolveBuilding(req);
  const floorNumber = Number(req.body.floorNumber ?? 0);

  let floor = req.body.floor;
  if (!floor) {
    const floorDoc = await Floor.findOneAndUpdate(
      { building, floorNumber },
      { $setOnInsert: { building, floorNumber, name: floorNumber === 0 ? "Ground Floor" : `Floor ${floorNumber}` } },
      { upsert: true, new: true }
    );
    floor = floorDoc._id;
  }

  const room = await Room.create({
    building,
    floor,
    name: req.body.name,
    roomNumber: req.body.roomNumber,
    type: req.body.type || "meeting_room",
    capacity: req.body.capacity || 1,
    amenities: req.body.amenities || [],
    isBookable: req.body.isBookable !== false,
  });

  await Floor.findByIdAndUpdate(floor, { $inc: { totalRooms: 1 } });
  res.status(201).json(new ApiResponse(201, room, "Room created"));
});

exports.getRooms = asyncHandler(async (req, res) => {
  const filter = { isActive: { $ne: false } };
  const building = req.query.building || req.user.building;
  if (building) filter.building = building;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isBookable !== undefined) filter.isBookable = req.query.isBookable === "true";

  const rooms = await Room.find(filter)
    .populate("building", "name")
    .populate("floor", "name floorNumber")
    .sort("roomNumber name");

  res.status(200).json(new ApiResponse(200, rooms, "Rooms fetched"));
});

exports.updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) throw new ApiError(404, "Room not found");
  res.status(200).json(new ApiResponse(200, room, "Room updated"));
});

exports.deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false, isBookable: false }, { new: true });
  if (!room) throw new ApiError(404, "Room not found");
  res.status(200).json(new ApiResponse(200, null, "Room deactivated"));
});
