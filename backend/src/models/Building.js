const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["college", "office", "hospital", "mall", "residential"], required: true },
    address: {
      line1: String, city: String, state: String, pincode: String, country: { type: String, default: "India" },
    },
    totalFloors: { type: Number, default: 0 },
    totalArea: { type: Number, default: 0 },
    image: { type: String, default: "" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    amenities: [String],
    efficiencyScore: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
