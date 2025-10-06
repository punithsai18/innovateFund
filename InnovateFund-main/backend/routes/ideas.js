import express from "express";
import multer from "multer";
import Idea from "../models/Idea.js";
import User from "../models/User.js";
import { requireRole } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { uploadFileToFirebase, generateImpactScore } from "../utils/helpers.js";
import { sendNotification } from "../controllers/notificationController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ---------------- Update (edit) an idea ----------------
router.put("/:id", requireRole(["innovator"]), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }
    if (idea.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // Only allow updating certain fields
    const allowedFields = [
      "title",
      "description",
      "category",
      "stage",
      "fundingGoal",
      "tags",
      "status",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        idea[field] = req.body[field];
      }
    });
    await idea.save();
    await idea.populate("creator", "name profilePicture company");
    res.json({ message: "Idea updated successfully", idea });
  } catch (error) {
    console.error("Update idea error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// ---------------- Get all published ideas ----------------
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      stage,
      search,
      sortBy = "createdAt",
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: "published" };

    if (category) filter.category = category;
    if (stage) filter.stage = stage;
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      createdAt: { createdAt: -1 },
      likes: { likes: -1 },
      funding: { currentFunding: -1 },
      impact: { impactScore: -1 },
    };

    const ideas = await Idea.find(filter)
      .populate("creator", "name profilePicture company")
      .populate("likes.user", "name")
      .populate("comments.user", "name profilePicture")
      .sort(sortOptions[sortBy] || { createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Idea.countDocuments(filter);

    res.json({
      ideas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Get single idea by ID ----------------
router.get("/:id", async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate("creator", "name profilePicture company bio")
      .populate("collaborators.user", "name profilePicture")
      .populate("likes.user", "name")
      .populate("comments.user", "name profilePicture")
      .populate("investments.investor", "name profilePicture company");

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Increment view count
    idea.views += 1;
    await idea.save();

    res.json({ idea });
  } catch (error) {
    console.error("Get idea error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Create new idea (auto-published) ----------------
router.post(
  "/",
  requireRole(["innovator"]),
  validateRequest(schemas.createIdea),
  async (req, res) => {
    try {
      const { title, description, category, stage, fundingGoal, tags } = req.body;

      // Generate AI impact score
      const impactScore = await generateImpactScore({
        title,
        description,
        category,
        stage,
      });

      const idea = new Idea({
        title,
        description,
        category,
        stage,
        fundingGoal,
        tags: tags || [],
        creator: req.user._id,
        impactScore,
        status: "published", // 👈 auto-publish all new ideas
      });

      await idea.save();
      await idea.populate("creator", "name profilePicture company");

      res.status(201).json({
        message: "Idea created & published successfully",
        idea,
      });
    } catch (error) {
      console.error("Create idea error:", error);
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ message: "Validation error", details: error.message });
      }
      if (error.code && error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Duplicate key error", details: error.keyValue });
      }
      res.status(500).json({ message: "Server error", details: error.message });
    }
  }
);

// ---------------- Upload files ----------------
router.post("/:id/upload", upload.array("files", 5), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    if (idea.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        const fileUrl = await uploadFileToFirebase(file, `ideas/${idea._id}`);
        uploadedFiles.push({
          fileName: file.originalname,
          fileUrl,
          fileType: file.mimetype,
        });
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
      }
    }

    idea.attachments.push(...uploadedFiles);
    await idea.save();

    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload files error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Like/unlike idea ----------------
router.post("/:id/like", async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const existingLike = idea.likes.find(
      (like) => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      idea.likes = idea.likes.filter(
        (like) => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      idea.likes.push({ user: req.user._id });

      // Send notification
      if (idea.creator.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: idea.creator,
          sender: req.user._id,
          type: "idea_liked",
          title: "Your idea was liked!",
          message: `${req.user.name} liked your idea "${idea.title}"`,
          relatedItem: { itemType: "idea", itemId: idea._id },
          actionUrl: `/ideas/${idea._id}`,
        });
      }
    }

    await idea.save();

    res.json({
      message: existingLike ? "Idea unliked" : "Idea liked",
      likesCount: idea.likes.length,
    });
  } catch (error) {
    console.error("Like idea error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Add comment (with rating) ----------------
router.post("/:id/comments", async (req, res) => {
  try {
    const { content, rating } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const comment = {
      user: req.user._id,
      content,
      rating: rating || 5,
      createdAt: new Date(),
    };

    idea.comments.push(comment);
    await idea.save();

    await idea.populate("comments.user", "name profilePicture");

    // Notify creator
    if (idea.creator.toString() !== req.user._id.toString()) {
      await sendNotification({
        recipient: idea.creator,
        sender: req.user._id,
        type: "idea_commented",
        title: "New comment on your idea",
        message: `${req.user.name} commented on your idea "${idea.title}"`,
        relatedItem: { itemType: "idea", itemId: idea._id },
        actionUrl: `/ideas/${idea._id}`,
      });
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: idea.comments[idea.comments.length - 1],
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// ---------------- Update comment ----------------
router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { content, rating } = req.body;
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: "Idea not found" });

    const comment = idea.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only allow owner to edit
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (content) comment.content = content;
    if (rating !== undefined) comment.rating = rating;
    comment.updatedAt = new Date();

    await idea.save();
    await idea.populate("comments.user", "name profilePicture");

    res.json({ message: "Comment updated", comment });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Delete comment ----------------
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: "Idea not found" });

    const comment = idea.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only allow owner to delete
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.remove();
    await idea.save();

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ---------------- Request collaboration ----------------
router.post("/:id/collaborate", async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    if (idea.creator.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot collaborate on your own idea" });
    }

    const existingCollaborator = idea.collaborators.find(
      (collab) => collab.user.toString() === req.user._id.toString()
    );

    if (existingCollaborator) {
      return res
        .status(400)
        .json({ message: "You are already a collaborator" });
    }

    // Notify creator
    await sendNotification({
      recipient: idea.creator,
      sender: req.user._id,
      type: "collaboration_request",
      title: "Collaboration Request",
      message: `${req.user.name} wants to collaborate on "${idea.title}"`,
      relatedItem: { itemType: "idea", itemId: idea._id },
      actionUrl: `/ideas/${idea._id}`,
    });

    res.json({ message: "Collaboration request sent successfully" });
  } catch (error) {
    console.error("Collaborate request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
