const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["water_leakage", "ac_failure", "internet_issue", "lift_problem", "cleaning", "electrical", "other"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: ["pending", "in_progress", "resolved", "closed"], default: "pending" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    images: [String],
    resolvedAt: Date,
    floor: { type: mongoose.Schema.Types.ObjectId, ref: "Floor", default: null },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
