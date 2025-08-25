import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
// import dotenv from "dotenv";
// dotenv.config();

// Connect to server


const socket = io("http://localhost:7777" || "https://zedsphere-chat-app.onrender.com" );


export default socket;

// Join a specific chat room
export function joinChat(chatId) {
  socket.emit("join chat", chatId);
}

// Send a new message
export function sendMessageSocket(message) {
  socket.emit("new message", message);
}

// Handle new chat creation from server
socket.on("chatCreated", (chat) => {
  // ✅ Only push if not already in memory
  if (!window.allChats.some(c => c._id === chat._id)) {
    window.allChats.push(chat);
  }

  // ✅ Always try to add to sidebar, DOM handles duplicates
  addChatToSidebar(chat);
});



// Emit typing status
export function emitTyping(chatId) {
  console.log("emitTyping called with chatId:", chatId);
  socket.emit("typing", { chatId });
}

// Emit stop typing status
export function emitStopTyping(chatId) {
  console.log("emitStopTyping called with chatId:", chatId);
  socket.emit("stop typing", { chatId });
}

// Listen for new messages
export function onMessageReceived(callback) {
  socket.on("message received", callback);
}

// Listen for typing indicator
export function onTyping(callback) {
  socket.on("typing", (data) => {
    console.log("typing event received:", data);
    callback();
  });
}

// Listen for stop typing indicator
export function onStopTyping(callback) {
  socket.on("stop typing", (data) => {
    console.log("stop typing event received:", data);
    callback();
  });
}
