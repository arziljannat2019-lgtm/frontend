document.getElementById("viewReportBtn").onclick = function () 

    let from = document.getElementById("fromDate").value;
    let to = document.getElementById("toDate").value;

    let box = document.getElementById("reportOutput");
    box.innerHTML = "<p>Loading...</p>";

    // CHANGE THIS TO YOUR BACKEND ROUTE
document.getElementById("viewReportBtn").onclick = async function () {

    let from = document.getElementById("fromDate").value;
    let to = document.getElementById("toDate").value;
    let branch = localStorage.getItem("branch");

    let box = document.getElementById("reportOutput");
    box.innerHTML = "<p>Loading...</p>";

    try {
        let url = `http://localhost:5000/api/history/range?branch=${branch}&from=${from}&to=${to}`;
        let res = await fetch(url);
        let data = await res.json();

        let game = data.reduce((s, x) => s + (x.total_amount || 0), 0);
        let canteen = data.reduce((s, x) => s + (x.canteen_amount || 0), 0);

        box.innerHTML = `
            <h3>Branch Report</h3>
            <p><b>Game Income:</b> Rs ${game}</p>
            <p><b>Canteen Sales:</b> Rs ${canteen}</p>
            <p><b>Total Records:</b> ${data.length}</p>
            <hr>
            <h3>Total Profit: Rs ${game + canteen}</h3>
        `;
    } catch (e) {
        box.innerHTML = "<p>Error. Try again.</p>";
    }
};

