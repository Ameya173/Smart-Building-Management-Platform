const asyncHandler = require("express-async-handler");
const MaintenanceTicket = require("../models/MaintenanceTicket");
const Asset = require("../models/Asset");
const Notification = require("../models/Notification");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

const createNotification = async (recipient, title, message, type = "maintenance", building = null) => {
  await Notification.create({ recipient, building, type, title, message });
};

exports.createTicket = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.body.asset);
  if (!asset) throw new ApiError(404, "Asset not found");

  const building = req.body.building || asset.building;
  const ticket = await MaintenanceTicket.create({ ...req.body, building, raisedBy: req.user._id });

  await Asset.findByIdAndUpdate(req.body.asset, { status: "under_maintenance" });

  if (req.body.assignedTo) {
    await createNotification(
      req.body.assignedTo,
      "New Maintenance Task",
      `You have been assigned a maintenance ticket: ${req.body.title}`,
      "maintenance",
      req.body.building
    );
  }
  res.status(201).json(new ApiResponse(201, ticket, "Maintenance ticket created"));
});

exports.getTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };

  // Maintenance staff only see their assigned tickets
  if (req.user.role === "maintenance_staff") filter.assignedTo = req.user._id;

  const [tickets, total] = await Promise.all([
    MaintenanceTicket.find(filter)
      .populate("asset", "name category")
      .populate("building", "name")
      .populate("assignedTo", "name email")
      .populate("raisedBy", "name email")
      .sort(sort).skip(skip).limit(limit),
    MaintenanceTicket.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(tickets, total, page, limit), "Tickets fetched"));
});

exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await MaintenanceTicket.findById(req.params.id)
    .populate("asset", "name category status healthScore")
    .populate("building", "name")
    .populate("assignedTo", "name email phone")
    .populate("raisedBy", "name email");
  if (!ticket) throw new ApiError(404, "Ticket not found");
  res.status(200).json(new ApiResponse(200, ticket, "Ticket fetched"));
});

exports.updateTicket = asyncHandler(async (req, res) => {
  const ticket = await MaintenanceTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  // Maintenance staff can only update status/notes
  if (req.user.role === "maintenance_staff") {
    const allowed = ["status", "notes", "actualCost"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    Object.assign(ticket, updates);
  } else {
    Object.assign(ticket, req.body);
  }

  if (req.body.status === "resolved") {
    ticket.resolvedAt = new Date();
    await Asset.findByIdAndUpdate(ticket.asset, { status: "operational" });
    await createNotification(ticket.raisedBy, "Ticket Resolved", `Your maintenance ticket "${ticket.title}" has been resolved.`, "maintenance", ticket.building);
  }

  await ticket.save();
  res.status(200).json(new ApiResponse(200, ticket, "Ticket updated"));
});

exports.deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  res.status(200).json(new ApiResponse(200, null, "Ticket closed"));
});

exports.getMaintenanceStats = asyncHandler(async (req, res) => {
  const filter = req.query.building ? { building: req.query.building, isActive: { $ne: false } } : { isActive: { $ne: false } };
  const byStatus = await MaintenanceTicket.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 }, totalCost: { $sum: "$actualCost" } } },
  ]);
  const byPriority = await MaintenanceTicket.aggregate([
    { $match: filter },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);
  res.status(200).json(new ApiResponse(200, { byStatus, byPriority }, "Stats fetched"));
});
