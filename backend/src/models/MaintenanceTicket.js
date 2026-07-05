const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    images: [String],
    resolvedAt: Date,
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceTicket", maintenanceSchema);
