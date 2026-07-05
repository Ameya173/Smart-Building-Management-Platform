const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    attendees: { type: Number, default: 1 },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "confirmed" },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
