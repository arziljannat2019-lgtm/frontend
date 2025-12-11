// DASHBOARD JS (FRONTEND VERSION)
// NO require(), only fetch()

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

function loadDashboard() {
    const branch = localStorage.getItem("branch") || "Rasson 1";

    fetch(`http://localhost:5000/api/dashboard/summary/${branch}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("totalTables").innerText = data.total_tables;
            document.getElementById("activeTables").innerText = data.active_tables;
            document.getElementById("freeTables").innerText = data.free_tables;

            document.getElementById("todaySessions").innerText = data.today_sessions;
            document.getElementById("completedSessions").innerText = data.today_completed;

            document.getElementById("timeIncome").innerText = data.today_time_income;
            document.getElementById("canteenIncome").innerText = data.today_canteen_income;
            document.getElementById("totalIncome").innerText =
                data.today_time_income + data.today_canteen_income;

            document.getElementById("unpaidBills").innerText = data.today_unpaid;
            document.getElementById("paidBills").innerText = data.today_paid;

            loadCharts(data);
        })
        .catch(err => {
            console.error("Dashboard Load Error:", err);
        });
}

// CHARTS
function loadCharts(data) {

    // INCOME CHART
    const ctx1 = document.getElementById("incomeChart").getContext("2d");
    new Chart(ctx1, {
        type: "bar",
        data: {
            labels: ["Time Income", "Canteen", "Total"],
            datasets: [{
                label: "Income (PKR)",
                data: [
                    data.today_time_income,
                    data.today_canteen_income,
                    data.today_time_income + data.today_canteen_income
                ],
                backgroundColor: [
                    "rgba(0,255,100,0.7)",
                    "rgba(0,200,255,0.7)",
                    "rgba(0,255,180,0.7)"
                ],
                borderColor: "#00ff99",
                borderWidth: 2
            }]
        }
    });

    // BILLS CHART
    const ctx2 = document.getElementById("billsChart").getContext("2d");
    new Chart(ctx2, {
        type: "doughnut",
        data: {
            labels: ["Paid", "Unpaid"],
            datasets: [{
                data: [data.today_paid, data.today_unpaid],
                backgroundColor: ["rgba(0,255,100,0.7)", "rgba(255,0,50,0.7)"],
                borderColor: "#00ff99",
                borderWidth: 2
            }]
        }
    });
}
