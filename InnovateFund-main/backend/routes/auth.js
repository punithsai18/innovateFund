import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

const router = express.Router();

// Register
router.post(
  "/register",
  validateRequest(schemas.register),
  async (req, res) => {
    try {
      const { name, email, password, userType, company, bio } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        userType,
        company,
        bio,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      // Fire and forget welcome email (don't block response)
      sendWelcomeEmail(user).catch((err) =>
        console.error("Deferred welcome email error:", err.message)
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// Login
router.post("/login", validateRequest(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
