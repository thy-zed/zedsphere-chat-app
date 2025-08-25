// login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Save user object (includes token)
      localStorage.setItem("user", JSON.stringify(data));

      // ✅ Redirect to chat page
      window.location.href = "chat.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    alert("An error occurred. Please try again.");
  }
});
