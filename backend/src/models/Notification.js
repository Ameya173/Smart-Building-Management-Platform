const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", default: null },
    type: { type: String, enum: ["maintenance", "complaint", "booking", "visitor", "energy", "system", "alert"], default: "system" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
