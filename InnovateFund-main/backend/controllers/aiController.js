import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// General Gemini AI chat endpoint
export const geminiChat = async (req, res) => {
  try {
    let messages = req.body.messages;

    // Support legacy prompt/message for compatibility
    if (!messages && (req.body.prompt || req.body.message)) {
      messages = [{ role: "user", content: req.body.prompt || req.body.message }];
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    // Combine messages into single user input (Gemini expects plain text)
    const userMessage = messages.map((m) => m.content).join("\n");

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: userMessage }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    const aiMessage =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ response: aiMessage });
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
};

// Impact score using Gemini
export const getImpactScore = async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: "Idea data is required." });
    }

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: `Rate the impact of this idea on a scale of 1 to 100 and explain briefly. Idea: ${idea}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    const impactScore =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ impactScore });
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
};

// Export for routes
export const chat = geminiChat;
export default { chat, getImpactScore, geminiChat };
