const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["patrol", "incident"],
      required: [true, "Please specify log type"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
    resolutionNotes: {
      type: String,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityLog", securityLogSchema);
