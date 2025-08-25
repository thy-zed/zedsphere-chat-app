import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Route for registering a new user
router.post("/index", registerUser);

// Route for logging in an existing user
router.post("/login", loginUser);

export default router;
