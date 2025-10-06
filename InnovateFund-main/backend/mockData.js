import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Idea from "./models/Idea.js";
import Notification from "./models/Notification.js";
import { Chat, Message } from "./models/Chat.js";
import connectDB from "./config/database.js";

dotenv.config();

async function createMockData() {
  await connectDB();

  // 1. Create/find admin user
  let admin = await User.findOne({ email: "admin@example.com" });
  if (!admin) {
    admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin123!",
      userType: "innovator",
      isVerified: true,
      bio: "Platform admin and test user.",
      location: "Test City",
      expertise: ["technology", "finance"],
      sectorsOfInterest: ["technology", "finance"],
      reputationScore: 90,
    });
    await admin.save();
    console.log("Created admin user.");
  } else {
    console.log("Admin user already exists.");
  }

  // 2. Create multiple mock ideas
  const ideasData = [
    {
      ideaId: "IDEA001",
      title: "Revolutionary FinTech App",
      description:
        "A platform to connect investors and innovators in real-time.",
      category: "finance",
      stage: "prototype",
      fundingGoal: 50000,
      currentFunding: 10000,
      tags: ["fintech", "innovation"],
      status: "published",
      impactScore: 75,
      milestones: [
        {
          title: "Prototype Complete",
          description: "MVP ready",
          targetAmount: 10000,
          achieved: true,
          achievedAt: new Date(),
        },
      ],
    },
    {
      ideaId: "IDEA002",
      title: "Green Energy Platform",
      description: "Connecting eco-friendly startups with investors.",
      category: "environment",
      stage: "mvp",
      fundingGoal: 80000,
      currentFunding: 25000,
      tags: ["green", "energy"],
      status: "published",
      impactScore: 82,
      milestones: [
        {
          title: "MVP Launched",
          description: "First users onboarded",
          targetAmount: 20000,
          achieved: true,
          achievedAt: new Date(),
        },
      ],
    },
    {
      ideaId: "IDEA003",
      title: "AI Health Assistant",
      description: "AI-powered health monitoring and advice.",
      category: "healthcare",
      stage: "beta",
      fundingGoal: 120000,
      currentFunding: 60000,
      tags: ["ai", "health"],
      status: "published",
      impactScore: 88,
      milestones: [
        {
          title: "Beta Release",
          description: "Beta testers invited",
          targetAmount: 50000,
          achieved: true,
          achievedAt: new Date(),
        },
      ],
    },
  ];
  const ideas = [];
  for (const ideaData of ideasData) {
    const idea = new Idea({ ...ideaData, creator: admin._id });
    await idea.save();
    ideas.push(idea);
  }
  console.log(`Created ${ideas.length} mock ideas.`);

  // 3. Create multiple mock notifications
  const notificationsData = [
    {
      recipient: admin._id,
      sender: admin._id,
      type: "milestone_achieved",
      title: "Milestone Achieved!",
      message: "Your idea has reached its first milestone.",
      relatedItem: { itemType: "idea", itemId: ideas[0]._id },
      actionUrl: `/ideas/${ideas[0]._id}`,
    },
    {
      recipient: admin._id,
      sender: admin._id,
      type: "idea_liked",
      title: "Idea Liked!",
      message: "Someone liked your Green Energy Platform idea.",
      relatedItem: { itemType: "idea", itemId: ideas[1]._id },
      actionUrl: `/ideas/${ideas[1]._id}`,
    },
    {
      recipient: admin._id,
      sender: admin._id,
      type: "message_received",
      title: "New Message!",
      message: "You have a new message in your chat.",
      relatedItem: { itemType: "chat", itemId: null },
      actionUrl: `/chats/`,
    },
  ];
  for (const notificationData of notificationsData) {
    const notification = new Notification(notificationData);
    await notification.save();
  }
  console.log(`Created ${notificationsData.length} mock notifications.`);

  // 4. Create mock chat and multiple messages
  const chat = new Chat({
    participants: [admin._id],
    isGroupChat: false,
    chatName: "Admin Test Chat",
  });
  await chat.save();

  const messagesData = [
    {
      chat: chat._id,
      sender: admin._id,
      content: "Welcome to the platform! This is a test message.",
      messageType: "text",
    },
    {
      chat: chat._id,
      sender: admin._id,
      content: "Here is another message for testing.",
      messageType: "text",
    },
    {
      chat: chat._id,
      sender: admin._id,
      content: "Let me know if you need more mock data.",
      messageType: "text",
    },
  ];
  let lastMessageId = null;
  for (const msgData of messagesData) {
    const message = new Message(msgData);
    await message.save();
    lastMessageId = message._id;
  }
  chat.lastMessage = lastMessageId;
  await chat.save();
  console.log(`Created ${messagesData.length} mock chat messages.`);

  mongoose.connection.close();
  console.log("Mock data insertion complete.");
}

createMockData().catch((err) => {
  console.error("Error inserting mock data:", err);
  mongoose.connection.close();
});
