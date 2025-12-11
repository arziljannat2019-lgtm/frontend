console.log("LOAD-NAVBAR JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    fetch("../html/navbar.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
            initializeNavbar();
        });
});

function initializeNavbar() {

    let role = (localStorage.getItem("role") || "").trim().toLowerCase();
    let branch = localStorage.getItem("branch");

    // Hide admin-only if needed
    if (role === "supervisor" || role === "frontdesk") {
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
        let sel = document.getElementById("branchSelect");
        if (sel) sel.style.display = "none";
    }

    // Set branch
    let sel = document.getElementById("branchSelect");
    if (branch && sel) sel.value = branch;

    // Branch change (admin/manager only)
    if (sel) {
        sel.addEventListener("change", () => {
            if (role === "admin" || role === "manager") {
                localStorage.setItem("branch", sel.value);
                location.reload();
            }
        });
    }

    // Active page
    let current = window.location.pathname.split("/").pop().replace(".html", "");
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if (btn.dataset.page === current) btn.classList.add("active-nav");
    });

    // FIXED LOGOUT
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../index.html";
    });

    // Navigation function
    window.goTo = function (page) {
        window.location.href = `../html/${page}.html`;
    };
}
