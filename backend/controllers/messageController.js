import Message from "../models/message.js";
import Chat from "../models/chat.js";

/* ─────────────── POST /api/message ─────────────── */
export const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;
    if (!content || !chatId)
      return res.status(400).json({ message: "Content and chatId required" });

    // 1. Create the raw message
    const newMessage = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
    });

    // 2. Populate sender and chat
    let message = await Message.findById(newMessage._id)
      .populate({ path: "sender", select: "username email" })
      .populate({ path: "chat" });

    // 3. Update unread counts + latest message
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.users.forEach((userId) => {
        if (userId.toString() !== req.user._id.toString()) {
          chat.unreadMessages?.set?.(
            userId.toString(),
            (chat.unreadMessages?.get(userId.toString()) || 0) + 1
          );
        }
      });

      chat.latestMessage = message._id;
      await chat.save();
    }

    // 4. Emit via Socket.IO
    req.io?.to(chatId).emit("message:received", message);

    return res.status(201).json(message);
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

/* ─────────────── GET /api/message/:chatId ─────────────── */
export const fetchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chat: chatId })
      .populate({ path: "sender", select: "username" })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ fetchMessages error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
