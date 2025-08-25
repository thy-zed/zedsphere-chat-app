// chat.js
// Handles chat UI, message rendering, search, and socket events
// Depends on socket.js for real-time messaging
import socket, {
  joinChat,
  sendMessageSocket,
  emitTyping,
  emitStopTyping,
  onMessageReceived,
  onTyping,
  onStopTyping,
} from "./socket.js";

//Global State 
let currentUser = null;
let selectedChat = null;
window.allChats = window.allChats || [];

// Spinner overlay for loading messages
const chatSpinner = document.getElementById("chat-spinner");

// Spinner Helpers
function showSpinner() {
  chatSpinner.style.display = "flex";
}
function hideSpinner() {
  chatSpinner.style.display = "none";
}

// On Page Load
document.addEventListener("DOMContentLoaded", async () => {
  // Load current user from localStorage
  currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser) {
    window.location.href = "/login.html";
    return;
  }

  // Load sidebar chats
  await loadUserChats();

  // Register UI event listeners
  setupEventListeners();

  // Setup socket.io
  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
  }); 
  socket.emit("setup", currentUser);

  onMessageReceived(handleIncomingMessage);
  onTyping(showTypingIndicator);
  onStopTyping(hideTypingIndicator);
});

// Load & Display User Chats (Sidebar)
async function loadUserChats() {
  try {
    const res = await fetch("/api/chat", {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    const chats = await res.json();

    window.allChats = chats;

    chats.forEach(chat => {
      addChatToSidebar(chat);
    });
  } catch (err) {
    console.error("Error loading chats:", err);
  }
}
function displayChats(chats) {
  const dmList = document.getElementById("dm-list");
  dmList.innerHTML = "";

  chats.forEach((chat) => {
    const li = document.createElement("li");
    li.textContent = chat.users.find((u) => u._id !== currentUser._id)?.username;
    li.onclick = () => openChat(chat);
    addChatToSidebar(chat);
  });
}

// Open A Chat
async function openChat(chat) {
  selectedChat = chat;

  // Update chat header
  const otherUser = chat.users.find((u) => u._id !== currentUser._id);
  document.getElementById("chat-title").textContent =
    chat.isGroupChat ? chat.chatName : (otherUser ? otherUser.username : "Chat");

  // Highlight chat in sidebar
  document.querySelectorAll("#dm-list li").forEach(li => li.classList.remove("active"));
  const li = document.querySelector(`[data-chat-id='${chat._id}']`);
  if (li) li.classList.add("active");

  showSpinner();

  try {
    // Clear old messages
    const messagesContainer = document.querySelector(".chat-messages");
    messagesContainer.innerHTML = "";

    // Disable input while loading
    document.getElementById("message-input").disabled = true;

    // Fetch chat messages
    const res = await fetch(`/api/message/${selectedChat._id}`, {
      headers: { Authorization: `Bearer ${currentUser.token}` },
    });
    const messages = await res.json();

    // Render all messages
    messages.forEach(renderMessage);

    // Enable input again
    document.getElementById("message-input").disabled = false;
  } catch (err) {
    console.error("❌ Failed to load messages:", err);
  } finally {
    hideSpinner();
  }

  // Join chat room
  joinChat(selectedChat._id);

  // Clear old typing indicator
  const oldTyping = document.getElementById("typing-indicator");
  if (oldTyping) oldTyping.remove();
}

function getOtherUser(users) {
  if (!users || users.length < 2) {
    return { username: "Unknown User" }; // fallback
  }

  const other = users.find((u) => u._id !== currentUser._id);
  return other || { username: "Unknown User" }; // safe return
}

// ✅ Only check DOM for duplicates
function chatExists(chatId) {
  if (window.allChats && window.allChats.some(c => c._id === chatId)) {
    return true;
  // }
  // if (document.querySelector(`[data-chat-id='${chatId}']`)) {
  //   return true;
  }
  return false;
}

// ✅ Sidebar handler
function addChatToSidebar(chat) {
  const dmList = document.getElementById("dm-list");

  const li = document.createElement("li");
  li.dataset.chatId = chat._id;
  li.textContent = chat.isGroupChat
    ? chat.chatName
    : getOtherUser(chat.users).username;

  li.addEventListener("click", () => openChat(chat));
  dmList.appendChild(li);
}


// Render Message In Chat
// ✅ Sidebar chat item
function renderChatItem(chat) {
  const sidebar = document.getElementById("sidebar");
  const unread = chat.unreadMessages?.[currentUser._id] || 0;

  const chatItem = document.createElement("div");
  chatItem.className = "chat-item";
  chatItem.textContent = chat.chatName || getOtherUser(chat.users).username;

  if (unread > 0) {
    chatItem.classList.add("unread");

    const badge = document.createElement("span");
    badge.className = "unread-badge";
    badge.textContent = unread;
    chatItem.appendChild(badge);
  }

  chatItem.addEventListener("click", async () => {
    await fetch(`/api/chat/${chat._id}/reset-unread`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.token}`,
      },
    });

    chatItem.classList.remove("unread");
    const badge = chatItem.querySelector(".unread-badge");
    if (badge) badge.remove();
  });

  sidebar.appendChild(chatItem);
}

// ✅ Actual message bubble inside chat
function renderMessage(message) {
  const messagesContainer = document.querySelector(".chat-messages");

  const msgDiv = document.createElement("div");
  const isMe = message.sender._id === currentUser._id;

  // ✅ Apply correct class
  msgDiv.className = isMe ? "message sent" : "message received";

  msgDiv.innerHTML = `
    <div class="bubble">${message.content}</div>
    <span class="time">
      ${new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  `;

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}




// Handle Incoming Socket Messages
function handleIncomingMessage(message) {
  if (!selectedChat || message.chat._id !== selectedChat._id) {
    console.log("📥 New message for a different chat");
    return;
  }
  if (message.sender && message.sender._id === currentUser._id) return;
  renderMessage(message);;
}

// Typing Indicator
function showTypingIndicator() {
  const container = document.querySelector(".chat-messages");
  let typing = document.getElementById("typing-indicator");

  if (!typing) {
    typing = document.createElement("div");
    typing.id = "typing-indicator";
    typing.textContent = "Typing...";
    typing.style.color = "#999";
    typing.style.fontStyle = "italic";
    typing.style.padding = "5px 10px";
    container.appendChild(typing);
  }

  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

// Setup UI Event Listeners
function setupEventListeners() {
  const form = document.getElementById("message-form");
  const input = document.getElementById("message-input");
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-user");

  // 🔍 User Search
  async function handleUserSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  try {
    showSpinner();

    // 🔎 Search user by username
    const res = await fetch(`/api/user?search=${query}`, {
      headers: { Authorization: `Bearer ${currentUser.token}` },
    });
    const users = await res.json();

    if (users.length === 0) {
      alert("No user found");
      hideSpinner();
      return;
    }

    const user = users[0];

    // 🟢 Check if chat already exists in memory
    const existingChat = window.allChats?.find((chat) =>
      chat.users.some((u) => u._id === user._id)
    );

    if (existingChat) {
      openChat(existingChat);
      hideSpinner();
      return;
    }

    // 🚀 If not, request backend to create/find chat
    const chatRes = await fetch(`/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.token}`,
      },
      body: JSON.stringify({ userId: user._id }),
    });

    const chat = await chatRes.json();

    // Update cache
    if (!window.allChats) window.allChats = [];
    if (!window.allChats.some((c) => c._id === chat._id)) {
      window.allChats.unshift(chat);
      addChatToSidebar(chat);
    }

    openChat(chat);
  } catch (err) {
    console.error("❌ Search failed:", err);
  } finally {
    hideSpinner();
  }
}
  // Search button click
  searchBtn.addEventListener("click", handleUserSearch);

  // Pressing Enter in search input
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Avoid page reload
      handleUserSearch();
    }
  });

  // Send message form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content || !selectedChat) return;

    const message = { chatId: selectedChat._id, content };

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(message),
      });

      const saved = await res.json();

      // Update UI & notify others
      renderMessage(saved);
      sendMessageSocket(saved);

      // Reset typing state
      emitStopTyping(selectedChat._id);
      input.value = "";
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  });

  // Typing indicator logic
  input.addEventListener("input", () => {
    if (!selectedChat) return;
    emitTyping(selectedChat._id);

    clearTimeout(input.typingTimeout);
    input.typingTimeout = setTimeout(() => {
      emitStopTyping(selectedChat._id);
    }, 1000);
  });

  //Logout button
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  });
}
