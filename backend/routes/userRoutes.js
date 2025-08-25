import express from "express";
import { registerUser, searchUsers, loginUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/index", registerUser);

// Login user
router.post("/login", loginUser);

// Search users
router.get("/", protect, searchUsers);

export default router;
