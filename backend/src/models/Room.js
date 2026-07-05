const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    floor: { type: mongoose.Schema.Types.ObjectId, ref: "Floor", required: true },
    name: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true },
    type: { type: String, enum: ["meeting_room", "lab", "auditorium", "office", "classroom", "other"], default: "meeting_room" },
    capacity: { type: Number, default: 1 },
    amenities: [String],
    images: [String],
    isBookable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ building: 1, roomNumber: 1 }, { unique: true });
module.exports = mongoose.model("Room", roomSchema);
