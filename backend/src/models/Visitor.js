const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    purpose: { type: String, required: true },
    hostUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleNumber: { type: String, default: "" },
    idProofType: { type: String, enum: ["aadhar", "pan", "passport", "driving_license", "other"], default: "aadhar" },
    idProofNumber: { type: String, default: "" },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: ["pending", "approved", "checked_in", "checked_out", "rejected"], default: "pending" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    passCode: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);
