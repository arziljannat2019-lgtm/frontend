console.log("USERS JS LOADED SUCCESSFULLY");

// ========================================================
// USERS SYSTEM – ACCESS CONTROL (ADMIN + MANAGER ONLY)
// ========================================================

const token = localStorage.getItem("token");
const userRole = localStorage.getItem("role");      // FIXED NAME
const currentBranch = localStorage.getItem("branch"); // FIXED NAME

// ONLY ADMIN & MANAGER CAN ACCESS THIS PAGE
if (!token || (userRole !== "admin" && userRole !== "manager")) {
    alert("Access Denied: Only admin & manager can access Users page.");
    window.location = "dashboard.html";
}

let usersData = [];
let selectedUserId = null;

// ========================================================
// LOAD USERS ON PAGE LOAD
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

// ========================================================
// LOAD USERS FROM BACKEND
// ========================================================
async function loadUsers() {
    try {
        let res = await fetch("http://localhost:5000/api/users", {
            headers: { "Authorization": token }
        });

        usersData = await res.json();
        renderUsers();

    } catch (err) {
        console.error("User Load Error:", err);
    }
}

// ========================================================
// RENDER USERS TABLE
// ========================================================
function renderUsers() {
    const tbody = document.getElementById("usersBody");
    tbody.innerHTML = "";

    usersData.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${user.status}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>

                <td class="admin-only">
                    <button class="popup-btn" onclick="openEditUser(${user.id})">Edit</button>
                    <button class="popup-btn delete" onclick="openDeleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// ========================================================
// ADD USER POPUP
// ========================================================
function openAddUser() {
    console.log("openAddUser called");
    document.getElementById("addUserPopup").style.display = "flex";
}

function closeAddUser() {
    document.getElementById("addUserPopup").style.display = "none";
}

async function saveNewUser() {
    let username = document.getElementById("newUsername").value.trim();
    let password = document.getElementById("newPassword").value.trim();
    let userRole = document.getElementById("newRole").value;
    let status = document.getElementById("newStatus").value;

    if (!username || !password) {
        alert("Please enter username + password");
        return;
    }

    let res = await fetch("http://localhost:5000/api/users/add", {
        method: "POST",
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password,
            role: userRole,
            status
        })
    });

    let data = await res.json();
    alert(data.message);

    closeAddUser();
    loadUsers();
}

// ========================================================
// EDIT USER POPUP
// ========================================================
function openEditUser(id) {
    selectedUserId = id;

    const u = usersData.find(x => x.id === id);

    document.getElementById("editUsername").value = u.username;
    document.getElementById("editRole").value = u.role;
    document.getElementById("editStatus").value = u.status;
    document.getElementById("editPassword").value = "";

    document.getElementById("editUserPopup").style.display = "flex";
}

function closeEditUser() {
    document.getElementById("editUserPopup").style.display = "none";
}

async function updateUser() {
    let username = document.getElementById("editUsername").value.trim();
    let password = document.getElementById("editPassword").value.trim();
    let userRole = document.getElementById("editRole").value;
    let status = document.getElementById("editStatus").value;

    let body = {
        username,
        role: userRole,
        status
    };

    if (password) body.password = password;

    let res = await fetch(`http://localhost:5000/api/users/update/${selectedUserId}`, {
        method: "PUT",
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    let data = await res.json();
    alert(data.message);

    closeEditUser();
    loadUsers();
}

// ========================================================
// DELETE USER POPUP
// ========================================================
function openDeleteUser(id) {
    selectedUserId = id;
    document.getElementById("deleteUserPopup").style.display = "flex";
}

function closeDeleteUser() {
    document.getElementById("deleteUserPopup").style.display = "none";
}

async function confirmDeleteUser() {
    let res = await fetch(`http://localhost:5000/api/users/delete/${selectedUserId}`, {
        method: "DELETE",
        headers: { "Authorization": token }
    });

    let data = await res.json();
    alert(data.message);

    closeDeleteUser();
    loadUsers();
}
