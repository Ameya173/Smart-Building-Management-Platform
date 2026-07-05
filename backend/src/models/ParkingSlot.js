const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    slotNumber: { type: String, required: true },
    type: { type: String, enum: ["car", "bike", "visitor", "reserved"], default: "car" },
    isOccupied: { type: Boolean, default: false },
    occupiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    vehicleNumber: { type: String, default: "" },
    floor: { type: String, default: "Ground" },
    checkedInAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parkingSchema.index({ building: 1, slotNumber: 1 }, { unique: true });
module.exports = mongoose.model("ParkingSlot", parkingSchema);
