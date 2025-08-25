import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, fetchMessages } from "../controllers/messageController.js";

const router = express.Router();

// POST /api/message   → create / send a message
router.post("/", protect, sendMessage);

// GET  /api/message/:chatId → fetch all messages in a chat
router.get("/:chatId", protect, fetchMessages);

export default router;
