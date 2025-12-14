async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Username & password required");
    return;
  }

  try {
    const res = await fetch(
      "https://snooker-backend-grx0.onrender.com/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Login successful: " + data.role);
      // redirect example
      // window.location.href = "dashboard.html";
    } else {
      alert("Invalid login");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}
