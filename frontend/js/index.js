// index.js (Register script)
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch("http://localhost:7777/api/user/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Save the whole user object in localStorage
      localStorage.setItem("user", JSON.stringify(data));

      // ✅ Redirect to chat page
      window.location.href = "chat.html";
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    alert("An error occurred. Please try again.");
  }
});
