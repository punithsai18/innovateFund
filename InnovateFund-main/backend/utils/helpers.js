import { bucket } from '../config/firebase.js';
import path from 'path';
import axios from 'axios'; // Add axios import

export const uploadFileToFirebase = async (file, folderPath) => {
  if (!bucket) {
    throw new Error("Firebase storage not configured");
  }

  try {
    const fileName = `${folderPath}/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      public: true,
    });

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error("File upload error:", error);
    throw new Error("File upload failed");
  }
};

export const generateImpactScore = async (ideaData) => {
  // Use OpenRouter AI to generate impact score
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

  const { title, description, category, stage } = ideaData;
  const ideaText = `Title: ${title}\nDescription: ${description}\nCategory: ${category}\nStage: ${stage}`;

  const messages = [
    {
      role: "user",
      content: `Rate the impact of this idea on a scale of 1 to 100. Only return the number. Idea: ${ideaText}`,
    },
  ];

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "nousresearch/deephermes-3-llama-3-8b-preview:free",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the score from the AI response
    const aiContent = response.data.choices?.[0]?.message?.content || "";
    // Parse the score as an integer (ensure it's between 0-100)
    const score = Math.min(100, Math.max(0, parseInt(aiContent, 10) || 0));
    return score;
  } catch (error) {
    console.error("AI impact score error:", error?.response?.data || error);
    // Fallback to a default score if AI fails
    return 50;
  }
};

export const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateFundingProgress = (current, goal) => {
  return Math.min(100, Math.round((current / goal) * 100));
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
};

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

export const getFileExtension = (fileName) => {
  return path.extname(fileName).toLowerCase();
};
