const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { sendOtpEmail } = require("../utils/emailService");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, "Email already registered");

  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? "super_admin" : (role === "super_admin" ? "resident" : role || "resident");
  const otp = generateOtp();
  const user = await User.create({
    name, email, password,
    role: assignedRole,
    otp: { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 },
  });

  // Send OTP via email
  const emailSent = await sendOtpEmail(email, otp);
  if (!emailSent) {
    console.warn("Email config missing. OTP will be logged to console.");
    console.log(`📧 OTP for ${email}: ${otp}`);
  }

  return res.status(201).json(new ApiResponse(201,
    { userId: user._id, email: user.email },
    "Registered. Check your email for the OTP."
  ));
});

// Verify OTP
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.otp?.code || user.otp.code !== otp || user.otp.expiresAt < Date.now())
    throw new ApiError(400, "Invalid or expired OTP");

  user.isVerified = true;
  user.otp = undefined;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, "Email verified. You can now log in."));
});

// Login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError(401, "Invalid email or password");
  if (!user.isVerified) throw new ApiError(403, "Please verify your email first");
  if (!user.isActive) throw new ApiError(403, "Account deactivated");

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  // Populate building so frontend always gets { _id, name } (not raw ObjectId)
  const populatedUser = await User.findById(user._id).populate("building", "name");
  res.status(200).json(new ApiResponse(200, { user: populatedUser, accessToken }, "Login successful"));
});

// Refresh Token
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token missing");
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch { throw new ApiError(401, "Invalid or expired refresh token"); }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== token) throw new ApiError(401, "Token revoked");

  const accessToken = generateAccessToken(user._id, user.role);
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

// Logout
exports.logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.clearCookie("refreshToken");
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, "No account with that email");

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // In production, send actual reset link; in dev just return token
  if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const { sendResetPasswordEmail } = require("../utils/emailService");
    await sendResetPasswordEmail(user.email, resetLink);
  } else {
    console.log(`🔗 Password reset token for ${user.email}: ${resetToken}`);
  }

  res.status(200).json(new ApiResponse(200, 
    process.env.NODE_ENV === "production" ? {} : { resetToken },
    "Password reset instructions sent to your email"
  ));
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
  if (!user) throw new ApiError(400, "Token invalid or expired");

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
});

// Get Me
exports.getMe = asyncHandler(async (req, res) => {
  // Re-fetch with building populated so frontend gets { _id, name } consistently
  const user = await User.findById(req.user._id).populate("building", "name");
  res.status(200).json(new ApiResponse(200, user, "User fetched"));
});

// Update Profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "avatar"];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

// Get users. Super admin sees everyone; building staff see active users in their building for host/assignment pickers.
exports.getAllUsers = asyncHandler(async (req, res) => {
  const filter = { isActive: { $ne: false } };
  if (req.user.role !== "super_admin") {
    if (!req.user.building) throw new ApiError(400, "No building assigned to your account");
    filter.building = req.user.building;
  } else if (req.query.building) {
    filter.building = req.query.building;
  }
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const re = new RegExp(req.query.search, "i");
    filter.$or = [{ name: re }, { email: re }];
  }

  const users = await User.find(filter).populate("building", "name").sort("name");
  res.status(200).json(new ApiResponse(200, users, "Users fetched"));
});

// Update user (super admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, building, name, email } = req.body;
  const { ROLES } = require("../models/User");
  const Building = require("../models/Building");

  // Validate role
  if (role && !ROLES.includes(role)) throw new ApiError(400, "Invalid role");

  // Prevent changing super_admin accounts (except by themselves)
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) throw new ApiError(404, "User not found");
  if (targetUser.role === "super_admin" && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, "Cannot modify another super admin account");
  }
  // Prevent downgrading the only super_admin
  if (targetUser.role === "super_admin" && role && role !== "super_admin") {
    const superAdminCount = await User.countDocuments({ role: "super_admin" });
    if (superAdminCount <= 1) throw new ApiError(403, "Cannot downgrade the only super admin");
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;

  // Manage building: super_admin has no building
  const effectiveRole = updates.role ?? targetUser.role;
  if (effectiveRole === "super_admin") {
    updates.building = null;
  } else if (building !== undefined) {
    updates.building = building || null;
  }

  // --- Sync Building.manager for building_manager role ---
  const newBuildingId = updates.building !== undefined ? updates.building : targetUser.building;
  const oldBuildingId = targetUser.building;

  // If building_manager and building changed, update Building documents
  if (effectiveRole === "building_manager") {
    const oldBuildingIdStr = oldBuildingId ? oldBuildingId.toString() : null;
    const newBuildingIdStr = newBuildingId ? newBuildingId.toString() : null;

    if (oldBuildingIdStr !== newBuildingIdStr) {
      // Remove manager from old building
      if (oldBuildingIdStr) {
        await Building.findByIdAndUpdate(oldBuildingIdStr, { manager: null });
      }
      // Set manager on new building
      if (newBuildingIdStr) {
        // Unlink any existing manager of that building first
        await User.findOneAndUpdate(
          { building: newBuildingIdStr, role: "building_manager", _id: { $ne: req.params.id } },
          { building: null }
        );
        await Building.findByIdAndUpdate(newBuildingIdStr, { manager: req.params.id });
      }
    }
  } else {
    // If role changed away from building_manager, remove as manager from old building
    if (targetUser.role === "building_manager" && oldBuildingId) {
      await Building.findByIdAndUpdate(oldBuildingId, { manager: null });
    }
    // If building is being removed from a building_manager role-change, clear building.manager
    if (newBuildingId === null && oldBuildingId) {
      await Building.findByIdAndUpdate(oldBuildingId, { manager: null });
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("building", "name");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user, "User updated"));
});

// Delete user (super admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) throw new ApiError(404, "User not found");
  // Cannot delete a super_admin account
  if (targetUser.role === "super_admin") {
    throw new ApiError(403, "Cannot delete a super admin account");
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "User deleted"));
});

