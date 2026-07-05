const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort("-createdAt").limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched"));
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, "Marked as read"));
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, "All marked as read"));
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) throw new ApiError(404, "Notification not found");
  if (String(notif.recipient) !== String(req.user._id)) throw new ApiError(403, "Not authorized");
  await notif.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});
