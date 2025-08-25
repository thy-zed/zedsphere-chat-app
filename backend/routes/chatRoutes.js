import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  accessOrCreateChat,
  fetchChats
} from "../controllers/chatcontroller.js";

const router = express.Router();

// Direct Message Chat Routes
router.post("/", protect, accessOrCreateChat);
router.get("/", protect, fetchChats);

import { resetUnread } from "../controllers/chatcontroller.js";
router.put("/:chatId/reset-unread", protect, resetUnread);

export default router;
