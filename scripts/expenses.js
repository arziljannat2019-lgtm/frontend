console.log("EXPENSES JS LOADED");

const branch = localStorage.getItem("branch");
const role = localStorage.getItem("role");

let expensesList = [];
let selectedId = null;

// LOAD EXPENSES ON PAGE LOAD
document.addEventListener("DOMContentLoaded", loadExpenses);

async function loadExpenses() {
    let today = new Date().toISOString().slice(0,10);
    let res = await fetch(`http://localhost:5000/api/expenses/list?branch=${branch}&date=${today}`);

    expensesList = await res.json();
    renderExpenses(expensesList);
}

// RENDER TABLE
function renderExpenses(list) {
    const body = document.getElementById("expensesBody");
    body.innerHTML = "";

    let total = 0;
    list.forEach(x => total += Number(x.amount));
    document.getElementById("todayTotal").innerText = total + " PKR";

    list.forEach(x => {
        body.innerHTML += `
            <tr>
                <td>${x.title}</td>
                <td>${x.amount}</td>
                <td>${x.expense_type}</td>
                <td>${x.datetime}</td>
                <td>
                    ${(role === "admin" || role === "manager") ?
                        `
                        <button class='btn-green' onclick="openEditPopup(${x.id}, '${x.title}', ${x.amount}, '${x.expense_type}')">Edit</button>
                        <button class='btn-red' onclick="deleteExpense(${x.id})">Delete</button>
                        `
                        : `<span style="color:gray;">No Access</span>`}
                </td>
            </tr>
        `;
    });
}

// SEARCH EXPENSES
function searchExpenses() {
    const key = document.getElementById("searchInput").value.toLowerCase();
    const filtered = expensesList.filter(x =>
        x.title.toLowerCase().includes(key)
    );
    renderExpenses(filtered);
}

// FILTER BY TYPE (Daily/Monthly)
function filterByType() {
    const type = document.getElementById("filterType").value;

    if (type === "all") {
        renderExpenses(expensesList);
        return;
    }

    const filtered = expensesList.filter(x => x.expense_type === type);
    renderExpenses(filtered);
}

/* POPUPS */
function openAddPopup() {
    document.getElementById("addPopup").classList.remove("hide");
}
function closeAddPopup() {
    document.getElementById("addPopup").classList.add("hide");
}

function openEditPopup(id, title, amount, type) {
    if (!(role === "admin" || role === "manager")) return alert("Access Denied!");

    selectedId = id;
    document.getElementById("editTitle").value = title;
    document.getElementById("editAmount").value = amount;
    document.getElementById("editType").value = type;

    document.getElementById("editPopup").classList.remove("hide");
}
function closeEditPopup() {
    document.getElementById("editPopup").classList.add("hide");
}

/* ADD EXPENSE */
async function saveExpense() {
    const body = {
        title: document.getElementById("newTitle").value,
        amount: document.getElementById("newAmount").value,
        expense_type: document.getElementById("newType").value,
        branch_code: branch
    };

    await fetch(`http://localhost:5000/api/expenses/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    closeAddPopup();
    loadExpenses();
}

/* UPDATE EXPENSE */
async function updateExpense() {
    if (!(role === "admin" || role === "manager")) return alert("Access Denied!");

    const body = {
        title: document.getElementById("editTitle").value,
        amount: document.getElementById("editAmount").value,
        expense_type: document.getElementById("editType").value
    };

    await fetch(`http://localhost:5000/api/expenses/update?id=${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    closeEditPopup();
    loadExpenses();
}

/* DELETE EXPENSE */
async function deleteExpense(id) {
    if (!(role === "admin" || role === "manager")) return alert("Access Denied!");

    if (!confirm("Delete expense?")) return;

    await fetch(`http://localhost:5000/api/expenses/delete?id=${id}`, {
        method: "DELETE"
    });

    loadExpenses();
}
