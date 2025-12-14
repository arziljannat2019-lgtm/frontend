function login() {

    // READ VALUES FROM YOUR HTML FIELDS
    let branch = document.getElementById("branchCode").value.trim();
    let username = document.getElementById("loginUserId").value.trim();
    let password = document.getElementById("loginPassword").value.trim();
    let errorBox = document.getElementById("errorMsg");

    // VALIDATION
    if (!branch || !username || !password) {
        errorBox.textContent = "Please fill all fields.";
        return;
    }

    // CALL BACKEND LOGIN API
fetch("https://snooker-backend-grx6.onrender.com/api/auth/login", {


    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
})

    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            errorBox.textContent = "Invalid User ID or Password.";
            return;
        }

        // SAVE ROLE
        localStorage.setItem("role", data.role);

        // 🔥 BRANCH LOGIC (YOUR FINAL REQUIREMENT)
        // Supervisor / Frontdesk / Manager / Admin
        // ALL choose branch at login
        localStorage.setItem("branch", branch);

        // SAVE TOKEN
        localStorage.setItem("token", data.token);

        // REDIRECT
        window.location.href = "html/dashboard.html";
    })
    .catch(err => {
        console.error(err);
        errorBox.textContent = "Server Error, please try again.";
    });
}
