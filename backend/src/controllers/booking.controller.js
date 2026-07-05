const asyncHandler = require("express-async-handler");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

exports.createBooking = asyncHandler(async (req, res) => {
  const { room, startTime, endTime } = req.body;
  if (!startTime || !endTime || new Date(startTime) >= new Date(endTime))
    throw new ApiError(400, "End time must be after start time");

  const roomDoc = await Room.findById(room);
  if (!roomDoc) throw new ApiError(404, "Room not found");
  if (!roomDoc.isBookable) throw new ApiError(400, "Room is not available for booking");

  // Prevent double booking
  const conflict = await Booking.findOne({
    room,
    status: { $ne: "cancelled" },
    $or: [
      { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
    ],
  });
  if (conflict) throw new ApiError(409, "Room already booked for this time slot");

  const booking = await Booking.create({ ...req.body, building: roomDoc.building, bookedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, booking, "Room booked successfully"));
});

exports.getBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  if (req.query.room) filter.room = req.query.room;
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === "resident") filter.bookedBy = req.user._id;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("room", "name roomNumber type")
      .populate("bookedBy", "name email")
      .populate("building", "name")
      .sort(sort).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(bookings, total, page, limit), "Bookings fetched"));
});

exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room", "name roomNumber type capacity amenities")
    .populate("bookedBy", "name email phone")
    .populate("building", "name");
  if (!booking) throw new ApiError(404, "Booking not found");
  res.status(200).json(new ApiResponse(200, booking, "Booking fetched"));
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (String(booking.bookedBy) !== String(req.user._id) && req.user.role === "resident")
    throw new ApiError(403, "Not authorized");

  booking.status = "cancelled";
  booking.isActive = false;
  await booking.save();
  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
});

exports.getRoomAvailability = asyncHandler(async (req, res) => {
  const { roomId, date } = req.query;
  if (!roomId || !date) throw new ApiError(400, "roomId and date are required");

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    room: roomId,
    status: { $ne: "cancelled" },
    startTime: { $gte: dayStart, $lte: dayEnd },
  }).select("startTime endTime title bookedBy").populate("bookedBy", "name");

  res.status(200).json(new ApiResponse(200, bookings, "Availability fetched"));
});
