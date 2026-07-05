const mongoose = require("mongoose");

const energySchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    electricity: { units: { type: Number, default: 0 }, cost: { type: Number, default: 0 } },
    water: { units: { type: Number, default: 0 }, cost: { type: Number, default: 0 } },
    solar: { units: { type: Number, default: 0 }, savings: { type: Number, default: 0 } },
    totalCost: { type: Number, default: 0 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

energySchema.index({ building: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model("EnergyRecord", energySchema);
