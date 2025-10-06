import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();
// Firebase Admin SDK
import { firebaseAdmin } from "../config/firebase.js";

// Get notifications for current user
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, unread = false } = req.query;
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user._id };
    if (unread === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read
router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update FCM token
router.post("/fcm-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    req.user.fcmToken = token;
    await req.user.save();

    res.json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Update FCM token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
// Test route to send a notification to a device token
// Test route to send a notification to a device token
router.post("/test", async (req, res) => {
  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    return res
      .status(400)
      .json({ message: "token, title, and body are required" });
  }
  const message = {
    notification: { title, body },
    token,
  };
  try {
    await firebaseAdmin.messaging().send(message);
    res.status(200).json({ success: true, message: "Notification sent!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
