console.log("NAVBAR JS LOADED");

// Normalize role
let role = (localStorage.getItem("role") || "").trim().toLowerCase();
let branch = localStorage.getItem("branch");

// Supervisor + frontdesk restrictions
if (role === "supervisor" || role === "frontdesk") {
    document.querySelectorAll(".admin-only").forEach(el => {
        el.style.display = "none";
    });

    const branchSelector = document.getElementById("branchSelect");
    if (branchSelector) branchSelector.style.display = "none";
}

// Set selected branch
if (branch) {
    const branchSelect = document.getElementById("branchSelect");
    if (branchSelect) branchSelect.value = branch;
}

// Branch change
const branchSelect = document.getElementById("branchSelect");
if (branchSelect) {
    branchSelect.addEventListener("change", () => {
        if (role === "admin" || role === "manager") {
            localStorage.setItem("branch", branchSelect.value);
            location.reload();
        }
    });
}

// Active highlight
let currentPage = window.location.pathname.split("/").pop().replace(".html", "");
document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.dataset.page === currentPage) btn.classList.add("active-nav");
});

// Navigation
function goTo(page) {
    window.location.href = `../html/${page}.html`;
}
