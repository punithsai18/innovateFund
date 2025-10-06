import express from "express";
import aiController from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", aiController.geminiChat);
router.post("/impact-score", aiController.getImpactScore);

export default router;
