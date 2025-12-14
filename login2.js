async function login() {
  const branchCode = document.getElementById("branchCode").value;
  const username   = document.getElementById("loginUserId").value;
  const password   = document.getElementById("loginPassword").value;

  if (!branchCode || !username || !password) {
    document.getElementById("errorMsg").innerText = "All fields required";
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
        body: JSON.stringify({
          username,
          password,
          branchCode
        })
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Login successful (" + data.role + ")");
      // window.location.href = "dashboard.html";
    } else {
      document.getElementById("errorMsg").innerText = "Invalid login";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("errorMsg").innerText = "Server error";
  }
}
