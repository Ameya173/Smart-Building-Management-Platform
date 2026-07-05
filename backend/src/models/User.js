const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["super_admin", "building_manager", "maintenance_staff", "security_staff", "resident"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ROLES, default: "resident" },
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", default: null },
    phone: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otp: { code: String, expiresAt: Date },
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: { type: String, select: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
