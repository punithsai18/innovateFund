import express from "express";
import multer from "multer";
import User from "../models/User.js";
import Idea from "../models/Idea.js";
import { uploadFileToFirebase } from "../utils/helpers.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile pictures
});

// Change password
router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password required." });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update notification preferences
router.put("/notifications", async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationsEnabled: !!enabled },
      { new: true }
    ).select("-password -fcmToken");
    res.json({ message: "Notification preferences updated.", user });
  } catch (error) {
    console.error("Update notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete account
router.delete("/delete", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile
router.get("/profile/:id?", async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    const user = await User.findById(userId).select("-password -fcmToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's ideas if innovator
    let ideas = [];
    if (user.userType === "innovator") {
      ideas = await Idea.find({ creator: userId })
        .select(
          "title category stage currentFunding fundingGoal status createdAt likes"
        )
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({ user, ideas });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const {
      name,
      bio,
      location,
      company,
      website,
      linkedinProfile,
      expertise,
      sectorsOfInterest,
      investmentRange,
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (company !== undefined) updateData.company = company;
    if (website !== undefined) updateData.website = website;
    if (linkedinProfile !== undefined)
      updateData.linkedinProfile = linkedinProfile;
    if (expertise) updateData.expertise = expertise;
    if (sectorsOfInterest) updateData.sectorsOfInterest = sectorsOfInterest;
    if (investmentRange) updateData.investmentRange = investmentRange;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -fcmToken");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({
      message: "Update failed",
      error: error.message,
    });
  }
});

// Upload profile picture
router.post(
  "/profile-picture",
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Profile picture is required" });
      }

      const imageUrl = await uploadFileToFirebase(
        req.file,
        `profiles/${req.user._id}`
      );

      req.user.profilePicture = imageUrl;
      await req.user.save();

      res.json({
        message: "Profile picture updated successfully",
        profilePicture: imageUrl,
      });
    } catch (error) {
      console.error("Upload profile picture error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Search users
router.get("/search", async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const filter = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
      ],
    };

    if (type && ["innovator", "investor"].includes(type)) {
      filter.userType = type;
    }

    const users = await User.find(filter)
      .select(
        "name profilePicture company bio userType sectorsOfInterest reputationScore"
      )
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = {};

    if (req.user.userType === "innovator") {
      const ideas = await Idea.find({ creator: req.user._id });

      stats.totalIdeas = ideas.length;
      stats.publishedIdeas = ideas.filter(
        (idea) => idea.status === "published"
      ).length;
      stats.totalFunding = ideas.reduce(
        (sum, idea) => sum + idea.currentFunding,
        0
      );
      stats.totalLikes = ideas.reduce(
        (sum, idea) => sum + idea.likes.length,
        0
      );
      stats.totalViews = ideas.reduce((sum, idea) => sum + idea.views, 0);
    } else if (req.user.userType === "investor") {
      const investedIdeas = await Idea.find({
        "investments.investor": req.user._id,
      });

      stats.totalInvestments = req.user.totalInvestments;
      stats.successfulInvestments = req.user.successfulInvestments;
      stats.totalInvested = investedIdeas.reduce((sum, idea) => {
        const investment = idea.investments.find(
          (inv) => inv.investor.toString() === req.user._id.toString()
        );
        return sum + (investment ? investment.amount : 0);
      }, 0);
      stats.reputationScore = req.user.reputationScore;
    }

    res.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
