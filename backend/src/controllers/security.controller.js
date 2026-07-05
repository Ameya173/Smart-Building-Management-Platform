const asyncHandler = require("express-async-handler");
const SecurityLog = require("../models/SecurityLog");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

exports.createLog = asyncHandler(async (req, res) => {
  const building = req.body.building || req.user.building;
  if (!building) throw new ApiError(400, "Building is required");

  const log = await SecurityLog.create({
    ...req.body,
    building,
    loggedBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, log, "Security log created successfully"));
});

exports.getLogs = asyncHandler(async (req, res) => {
  const filter = {};
  const building = req.query.building || req.user.building;
  if (building) filter.building = building;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await SecurityLog.countDocuments(filter);
  const logs = await SecurityLog.find(filter)
    .populate("loggedBy", "name email")
    .populate("building", "name")
    .sort("-createdAt")
    .skip(startIndex)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        results: logs,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
      "Security logs fetched successfully"
    )
  );
});

exports.updateLog = asyncHandler(async (req, res) => {
  let log = await SecurityLog.findById(req.params.id);
  if (!log) throw new ApiError(404, "Log not found");

  log = await SecurityLog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, log, "Security log updated successfully"));
});

exports.deleteLog = asyncHandler(async (req, res) => {
  const log = await SecurityLog.findByIdAndDelete(req.params.id);
  if (!log) throw new ApiError(404, "Log not found");
  res.status(200).json(new ApiResponse(200, null, "Security log deleted"));
});
