const asyncHandler = require("express-async-handler");
const Asset = require("../models/Asset");
const MaintenanceTicket = require("../models/MaintenanceTicket");
const Complaint = require("../models/Complaint");
const Visitor = require("../models/Visitor");
const ParkingSlot = require("../models/ParkingSlot");
const EnergyRecord = require("../models/EnergyRecord");
const Building = require("../models/Building");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const buildingId = req.query.building || req.user.building;
  const filter = buildingId ? { building: buildingId } : {};
  const activeFilter = { ...filter, isActive: { $ne: false } };

  const [
    totalAssets,
    operationalAssets,
    faultyAssets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    openComplaints,
    todayVisitors,
    parkingSlots,
    recentTickets,
    recentComplaints,
    energyThisMonth,
  ] = await Promise.all([
    Asset.countDocuments(activeFilter),
    Asset.countDocuments({ ...activeFilter, status: "operational" }),
    Asset.countDocuments({ ...activeFilter, status: "faulty" }),
    MaintenanceTicket.countDocuments({ ...activeFilter, status: "open" }),
    MaintenanceTicket.countDocuments({ ...activeFilter, status: "in_progress" }),
    MaintenanceTicket.countDocuments({ ...activeFilter, status: "resolved" }),
    Complaint.countDocuments({ ...activeFilter, status: { $in: ["pending", "in_progress"] } }),
    Visitor.countDocuments({
      ...activeFilter,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    ParkingSlot.find(activeFilter).select("isOccupied"),
    MaintenanceTicket.find(activeFilter).sort("-createdAt").limit(5)
      .populate("asset", "name category")
      .populate("raisedBy", "name"),
    Complaint.find(activeFilter).sort("-createdAt").limit(5)
      .populate("raisedBy", "name"),
    EnergyRecord.findOne({
      ...filter,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    }),
  ]);

  const totalParking = parkingSlots.length;
  const occupiedParking = parkingSlots.filter((s) => s.isOccupied).length;

  // Ticket resolution rate
  const totalTickets = openTickets + inProgressTickets + resolvedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  // Asset health score avg
  const healthAgg = await Asset.aggregate([
    { $match: activeFilter },
    { $group: { _id: null, avgHealth: { $avg: "$healthScore" } } },
  ]);
  const avgHealthScore = Math.round(healthAgg[0]?.avgHealth || 0);

  // Monthly ticket trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const ticketTrend = await MaintenanceTicket.aggregate([
    { $match: { ...activeFilter, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Super admin extras
  let superAdminData = {};
  if (req.user.role === "super_admin") {
    const [totalBuildings, totalUsers] = await Promise.all([
      Building.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
    ]);
    superAdminData = { totalBuildings, totalUsers };
  }

  res.status(200).json(
    new ApiResponse(200, {
      assets: { total: totalAssets, operational: operationalAssets, faulty: faultyAssets, avgHealthScore },
      maintenance: { open: openTickets, inProgress: inProgressTickets, resolved: resolvedTickets, resolutionRate },
      complaints: { open: openComplaints },
      visitors: { today: todayVisitors },
      parking: { total: totalParking, occupied: occupiedParking, available: totalParking - occupiedParking },
      energy: energyThisMonth,
      recentTickets,
      recentComplaints,
      ticketTrend,
      ...superAdminData,
    }, "Dashboard stats fetched")
  );
});
