const asyncHandler = require("express-async-handler");
const Asset = require("../models/Asset");
const MaintenanceTicket = require("../models/MaintenanceTicket");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { paginate, buildPaginatedResponse } = require("../utils/queryHelper");

exports.createAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, asset, "Asset created"));
});

exports.getAssets = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const filter = { isActive: { $ne: false } };
  if (req.query.building) filter.building = req.query.building;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .populate("building", "name")
      .populate("floor", "name floorNumber")
      .populate("room", "name roomNumber")
      .sort(sort).skip(skip).limit(limit),
    Asset.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, buildPaginatedResponse(assets, total, page, limit), "Assets fetched"));
});

exports.getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate("building", "name")
    .populate("floor", "name floorNumber")
    .populate("room", "name roomNumber")
    .populate("createdBy", "name");
  if (!asset) throw new ApiError(404, "Asset not found");
  res.status(200).json(new ApiResponse(200, asset, "Asset fetched"));
});

exports.updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!asset) throw new ApiError(404, "Asset not found");
  res.status(200).json(new ApiResponse(200, asset, "Asset updated"));
});

exports.deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!asset) throw new ApiError(404, "Asset not found");
  res.status(200).json(new ApiResponse(200, null, "Asset deactivated"));
});

exports.getAssetsByBuilding = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ building: req.params.buildingId, isActive: { $ne: false } })
    .populate("floor", "name floorNumber")
    .populate("room", "name roomNumber")
    .sort("-createdAt");
  res.status(200).json(new ApiResponse(200, assets, "Assets fetched"));
});

exports.getAssetStats = asyncHandler(async (req, res) => {
  const filter = req.query.building ? { building: req.query.building } : {};
  const stats = await Asset.aggregate([
    { $match: { ...filter, isActive: { $ne: false } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgHealth: { $avg: "$healthScore" },
      },
    },
  ]);
  const byCategory = await Asset.aggregate([
    { $match: { ...filter, isActive: { $ne: false } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  res.status(200).json(new ApiResponse(200, { byStatus: stats, byCategory }, "Asset stats fetched"));
});

exports.getAssetPassport = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw new ApiError(404, "Asset not found");

  const tickets = await MaintenanceTicket.find({ asset: asset._id });
  
  const totalRepairs = tickets.length;
  let totalMaintenanceCost = 0;
  let totalDowntimeHours = 0;

  tickets.forEach(ticket => {
    totalMaintenanceCost += (ticket.actualCost || ticket.estimatedCost || 0);
    if (ticket.resolvedAt && ticket.createdAt) {
      const diffHours = (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
      totalDowntimeHours += diffHours;
    }
  });

  const ageInYears = asset.ageInYears || 0;
  const expectedLifespan = asset.expectedLifespanYears || 10;
  const healthScore = asset.healthScore || 100;
  const purchaseCost = asset.purchaseCost || 0;

  // AI Mock Calculations
  const remainingUsefulLife = Math.max(0, (expectedLifespan - ageInYears) * (healthScore / 100));
  
  // Failure probability increases as health decreases and age increases
  let failureProbability = 100 - healthScore + (ageInYears * 2);
  failureProbability = Math.max(0, Math.min(100, failureProbability));

  let recommendation = "";
  if (totalMaintenanceCost > (purchaseCost * 0.6) && remainingUsefulLife < 2) {
    recommendation = `Replacing this asset is highly recommended. It has consumed ${Math.round((totalMaintenanceCost / (purchaseCost || 1)) * 100)}% of its purchase cost in maintenance and is nearing the end of its useful life. Replacing it may reduce ongoing costs significantly.`;
  } else if (healthScore < 60) {
    recommendation = `This asset requires a major overhaul. Health is low (${healthScore}%) and failure probability is ${Math.round(failureProbability)}%. Consider an intensive maintenance sprint.`;
  } else {
    recommendation = `Asset is performing well. Maintain standard preventive maintenance schedules. Remaining useful life is estimated at ${remainingUsefulLife.toFixed(1)} years.`;
  }

  res.status(200).json(new ApiResponse(200, {
    asset,
    lifecycle: {
      totalRepairs,
      totalMaintenanceCost,
      totalDowntimeHours: Math.round(totalDowntimeHours),
      ageInYears: ageInYears.toFixed(2),
    },
    aiIntelligence: {
      failureProbability: Math.round(failureProbability),
      remainingUsefulLife: remainingUsefulLife.toFixed(1),
      recommendation
    }
  }, "Asset Passport generated"));
});

