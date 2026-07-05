const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    floorNumber: { type: Number, required: true },
    name: { type: String, trim: true },
    totalRooms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

floorSchema.index({ building: 1, floorNumber: 1 }, { unique: true });
module.exports = mongoose.model("Floor", floorSchema);
