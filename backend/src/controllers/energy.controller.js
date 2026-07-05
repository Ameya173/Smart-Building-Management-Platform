const asyncHandler = require("express-async-handler");
const EnergyRecord = require("../models/EnergyRecord");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

exports.addEnergyRecord = asyncHandler(async (req, res) => {
  const { building, month, year, electricity, water, solar } = req.body;
  const existing = await EnergyRecord.findOne({ building, month, year });
  if (existing) {
    Object.assign(existing, { electricity, water, solar, totalCost: (electricity?.cost || 0) + (water?.cost || 0) });
    await existing.save();
    return res.status(200).json(new ApiResponse(200, existing, "Energy record updated"));
  }
  const record = await EnergyRecord.create({
    ...req.body,
    totalCost: (electricity?.cost || 0) + (water?.cost || 0),
    recordedBy: req.user._id,
  });
  res.status(201).json(new ApiResponse(201, record, "Energy record added"));
});

exports.getEnergyRecords = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.building) filter.building = req.query.building;
  if (req.query.year) filter.year = parseInt(req.query.year);

  const records = await EnergyRecord.find(filter).sort({ year: -1, month: -1 }).limit(24);
  res.status(200).json(new ApiResponse(200, records, "Energy records fetched"));
});

exports.getEnergySummary = asyncHandler(async (req, res) => {
  const { building } = req.query;
  if (!building) throw new ApiError(400, "building query param required");

  const currentYear = new Date().getFullYear();
  
  // Fetch all records for the building for the current year (or last 12 months)
  const records = await EnergyRecord.find({ building, year: currentYear }).sort("month");
  
  let totalElectricity = 0;
  let totalWater = 0;
  let totalCost = 0;
  
  const trend = records.map(record => {
    const consumption = (record.electricity?.units || 0) + (record.water?.units || 0);
    const cost = record.totalCost || 0;
    const emissions = (record.electricity?.units || 0) * 0.4; // 0.4kg CO2 per kWh rough estimate

    totalElectricity += (record.electricity?.units || 0);
    totalWater += (record.water?.units || 0);
    totalCost += cost;

    return {
      _id: { month: record.month, year: record.year },
      consumption,
      cost,
      emissions
    };
  });

  const totalConsumption = totalElectricity + totalWater;
  const totalEmissions = totalElectricity * 0.4;
  
  // Calculate days passed in current year for avg daily
  const now = new Date();
  const daysInYear = Math.ceil((now - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24)) || 1;
  const avgDaily = totalConsumption / daysInYear;

  const stats = {
    totalConsumption,
    totalCost,
    totalEmissions,
    avgDaily
  };

  res.status(200).json(new ApiResponse(200, { stats, trend }, "Energy summary fetched"));
});
