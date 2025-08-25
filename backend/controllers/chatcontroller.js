// ✅ Direct Message Chat Controller
import mongoose from "mongoose";
import Chat from "../models/chat.js";

// Access or create private chat
// Access or create private chat
export const accessOrCreateChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 🟢 Find existing one-on-one chat safely
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, userObjectId] },
      "users.2": { $exists: false }, // ensure only 2 users
    })
      .populate("users", "-password")
      .populate("latestMessage");

    if (chat) {
      return res.json(chat);
    }

    // 🚀 If not found, create a new one
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userObjectId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "users",
      "-password"
    );
    req.io.to(req.user._id.toString()).emit("chatCreated", fullChat);
    req.io.to(userObjectId.toString()).emit("chatCreated", fullChat);

    res.status(201).json(fullChat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Fetch user chats
export const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset unread messages for a user when they open a chat
export const resetUnread = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.unreadMessages.set(req.user._id.toString(), 0);
    await chat.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};