import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "technology",
        "healthcare",
        "finance",
        "education",
        "environment",
        "social",
        "consumer",
        "enterprise",
      ],
    },
    stage: {
      type: String,
      enum: ["idea", "prototype", "mvp", "beta", "launched"],
      required: true,
    },
    fundingGoal: {
      type: Number,
      required: true,
      min: 1000,
    },
    currentFunding: {
      type: Number,
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          default: "contributor",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    videoUrl: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    impactScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "funded", "cancelled"],
      default: "draft",
    },
    tags: [
      {
        type: String,
        maxlength: 30,
      },
    ],
    milestones: [
      {
        title: String,
        description: String,
        targetAmount: Number,
        achieved: {
          type: Boolean,
          default: false,
        },
        achievedAt: Date,
      },
    ],
    investments: [
      {
        investor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: Number,
        investedAt: {
          type: Date,
          default: Date.now,
        },
        terms: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
ideaSchema.index({ title: "text", description: "text", tags: "text" });
ideaSchema.index({ category: 1, stage: 1 });
ideaSchema.index({ creator: 1 });
ideaSchema.index({ createdAt: -1 });

export default mongoose.model("Idea", ideaSchema);
