import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

/* ───────── Register ───────── */
export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists)
      return res.status(409).json({ message: "Username already exists" });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.toLowerCase(),
      password: hash
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username },
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ───────── Login ───────── */
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, username: user.username },
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
