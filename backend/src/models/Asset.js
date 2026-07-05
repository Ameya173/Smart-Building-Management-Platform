const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    floor: { type: mongoose.Schema.Types.ObjectId, ref: "Floor", default: null },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["hvac", "elevator", "electrical", "plumbing", "fire_safety", "it_equipment", "furniture", "generator", "solar_panel", "other"],
      required: true,
    },
    assetTag: { type: String, unique: true, sparse: true },
    manufacturer: { type: String, default: "" },
    model: { type: String, default: "" },
    purchaseDate: { type: Date, required: true },
    purchaseCost: { type: Number, default: 0 },
    warrantyExpiryDate: Date,
    installationDate: { type: Date, required: true },
    expectedLifespanYears: { type: Number, default: 10 },
    status: { type: String, enum: ["operational", "under_maintenance", "faulty", "decommissioned"], default: "operational" },
    images: [String],
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

assetSchema.virtual("ageInYears").get(function () {
  if (!this.purchaseDate) return null;
  return +((Date.now() - this.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
});
assetSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Asset", assetSchema);
