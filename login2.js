async function login() {
  const branchCode = document.getElementById("branchCode").value;
  const username = document.getElementById("loginUserId").value;
  const password = document.getElementById("loginPassword").value;

  if (!branchCode || !username || !password) {
    document.getElementById("errorMsg").innerText = "All fields required";
    return;
  }

  try {
    const res = await fetch(
      "https://snooker-backend-grx6.onrender.com/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, branchCode })
      }
    );

    const data = await res.json();

    if (data.success) {
      // 🔐 save session
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("branchCode", branchCode);

      // 👉 redirect
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("errorMsg").innerText = "Invalid login";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("errorMsg").innerText = "Server error";
  }
}
