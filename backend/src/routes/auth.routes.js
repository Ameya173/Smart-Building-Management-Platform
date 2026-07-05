const express = require("express");
const router = express.Router();
const { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword, getMe, updateProfile, getAllUsers, updateUser, deleteUser } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.post("/logout", protect, logout);
router.get("/users", protect, restrictTo("super_admin", "building_manager", "security_staff"), getAllUsers);
router.patch("/users/:id", protect, restrictTo("super_admin"), updateUser);
router.delete("/users/:id", protect, restrictTo("super_admin"), deleteUser);

module.exports = router;
