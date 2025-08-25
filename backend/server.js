// backend/server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with proper CORS
const ENV = process.env.NODE_ENV === "development" ? process.env.LOCAL_URL  : process.env.ONRENDER_URL
console.log(ENV);
const io = new Server(server, {
  cors: {
    origin: ENV, // make sure this matches your frontend port
    credentials: true,
  },
});

app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- Middleware ----------
app.use(cors({
  origin: "http://localhost:5500",
  credentials: true
}));
app.use(express.json());

// Inject Socket.IO into every request (optional but useful)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- Database ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// ---------- Routes ----------
import authRoutes    from "./routes/authRoutes.js";
import chatRoutes    from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes    from "./routes/userRoutes.js";

app.use("/api/auth",    authRoutes);
app.use("/api/chat",    chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/user",    userRoutes);

app.get("/", (req, res) => res.send("ZedSphere API is running..."));

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Join a chat room
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log(`👤 User ${socket.id} joined room: ${chatId}`);
  });

  // Message broadcast
  socket.on("new message", (message) => {
    const chatId = message.chatId || message.chat?._id;
    if (!chatId) return;
    console.log(`📨 Broadcasting to chat ${chatId}`);
    socket.to(chatId).emit("message received", message); // ✅ match frontend
  });

  // Typing indicators
  socket.on("typing", ({ chatId }) => {
    // console.log(`typing event received from ${socket.id} for chat ${chatId}`);
    socket.in(chatId).emit("typing", { chatId });
  });

  socket.on("stop typing", ({ chatId }) => {
    // console.log(`stop typing event received from ${socket.id} for chat ${chatId}`);
    socket.in(chatId).emit("stop typing");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});


// ---------- Start Server ----------
const PORT = process.env.PORT || 7777;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
