let pendingQueue = JSON.parse(localStorage.getItem("pendingQueue") || "[]");

function saveQueue() {
    localStorage.setItem("pendingQueue", JSON.stringify(pendingQueue));
}

async function sendToServer(url, data) {
    if (!navigator.onLine) {
        pendingQueue.push({ url, data });
        saveQueue();
        return;
    }

    try {
        await fetch("http://localhost:5000" + url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (err) {
        pendingQueue.push({ url, data });
        saveQueue();
    }
}




/******************************************************
 * GLOBAL DATA + LOCALSTORAGE SETUP
 ******************************************************/
let tables = [];
let shift1 = JSON.parse(localStorage.getItem("shift1") || "null");
let shift2 = JSON.parse(localStorage.getItem("shift2") || "null");
let editTargetId = null;
let deleteTargetId = null;

/******************************************************
 * SAVE STATE (MANDATORY)
 ******************************************************/
function saveState() {
    localStorage.setItem("snookerTables", JSON.stringify(tables));
}

/******************************************************
 * PAGE LOAD INITIALIZER
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {

    let saved = localStorage.getItem("snookerTables");

    if (saved) tables = JSON.parse(saved);
    else loadDefaultTables();

    renderTables();
    restoreTimers();

    bindAddTablePopup();
    bindShiftButtons();
    bindHistoryButtons();
});

/******************************************************
 * ADD TABLE POPUP BINDING (FIX)
 ******************************************************/
function bindAddTablePopup() {

    document.getElementById("addTableBtn").onclick = () => {
        document.getElementById("addTablePopup").classList.remove("hidden");
    };

    document.getElementById("cancelAddBtn").onclick = () => {
        document.getElementById("addTablePopup").classList.add("hidden");
    };

    document.getElementById("createTableBtn").onclick = () => {

        let name = document.getElementById("tableNameInput").value.trim();
        let frame = Number(document.getElementById("frameRateInput").value);
        let cen = Number(document.getElementById("centuryRateInput").value);

        if (!name) return alert("Enter table name");

        tables.push({
            id: Date.now(),
            name,
            frameRate: frame,
            centuryRate: cen,
            selectedRate: frame,
            isRunning: false,
            checkinTime: null,
            checkoutTime: null,
            playSeconds: 0,
            liveAmount: 0,
            canteenTotal: 0,
            history: []
        });

        saveState();
        renderTables();

        document.getElementById("addTablePopup").classList.add("hidden");
    };
}

/******************************************************
 * CREATE DEFAULT TABLES (FIRST TIME ONLY)
 ******************************************************/
function loadDefaultTables() {

    let names = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6"];

    names.forEach(name => {
        tables.push({
            id: Date.now() + Math.random(),
            name,
            frameRate: 7,
            centuryRate: 10,
            selectedRate: 7,

            isRunning: false,
            checkinTime: null,
            checkoutTime: null,
            playSeconds: 0,
            liveAmount: 0,
            canteenTotal: 0,

            history: []
        });
    });

    saveState();
}

/******************************************************
 * RENDER ALL TABLE CARDS
 ******************************************************/
function renderTables() {
    const box = document.getElementById("tablesContainer");
    box.innerHTML = "";

    tables.forEach(t => {

        const div = document.createElement("div");
        div.classList.add("table-box");

        div.innerHTML = `
            <div class="table-title">${t.name}</div>

            <div class="rate-selector">
                <select onchange="changeRate(${t.id}, this.value)">
                    <option value="${t.frameRate}">Frame (${t.frameRate})</option>
                    <option value="${t.centuryRate}">Century (${t.centuryRate})</option>
                </select>
            </div>

            <div class="timer-box">
                <div class="timer-line"><span>Check-in:</span><span id="checkin-${t.id}">--:--:--</span></div>
                <div class="timer-line"><span>Checkout:</span><span id="checkout-${t.id}">--:--:--</span></div>
                <div class="timer-line"><span>Play Time:</span><span id="playtime-${t.id}">00:00:00</span></div>
                <div class="timer-line"><span>Amount:</span><span id="amount-${t.id}">0</span></div>
            </div>

            <div class="table-actions">

                <div class="big-btn-row">
                    <button id="checkinBtn-${t.id}" class="neon-btn big-btn" onclick="checkIn(${t.id})">CHECK IN</button>
                    <button id="checkoutBtn-${t.id}" class="neon-btn big-btn red hidden" onclick="checkOut(${t.id})">CHECK OUT</button>
                    <div id="afterRow-${t.id}" class="dual-btn-row hidden">
                        <button class="neon-btn big-btn" onclick="showBill(${t.id})">VIEW BILL</button>
                        <button class="neon-btn big-btn" onclick="checkIn(${t.id})">CHECK IN</button>
                    </div>
                </div>

                <div class="second-row">
                    <button id="historyBtn-${t.id}" class="neon-btn small-btn" onclick="openHistory(${t.id})">HISTORY</button>
                    <button id="editBtn-${t.id}" class="neon-btn small-btn" onclick="editTable(${t.id})">EDIT</button>
                    <button id="deleteBtn-${t.id}" class="neon-btn small-btn red" onclick="deleteTableOpen(${t.id})">DELETE</button>

                    <button id="canteenBtn-${t.id}" class="neon-btn small-btn hidden" onclick="openCanteen(${t.id})">CANTEEN</button>
                    <button id="shiftBtn-${t.id}" class="neon-btn small-btn hidden" onclick="openTableShift(${t.id})">SHIFT TABLE</button>
                </div>

            </div>
        `;

        box.appendChild(div);
    });
}

/******************************************************
 * CHANGE RATE
 ******************************************************/
function changeRate(id, rate) {
    let t = tables.find(x => x.id === id);
    t.selectedRate = Number(rate);
    saveState();
}

/******************************************************
 * CHECK-IN FUNCTION
 ******************************************************/
function checkIn(id) {
    let t = tables.find(x => x.id === id);

    let now = Date.now();
    t.isRunning = true;
    t.checkinTime = now;
    t.checkoutTime = null;
    t.playSeconds = 0;
    t.liveAmount = 0;
    t.canteenTotal = 0;

    // add history
    t.history.push({
        checkin: now,
        startMs: now,
        checkout: null,
        endMs: null,
        playSeconds: 0,
        amount: 0,
        canteenAmount: 0,
        paid: false
    });

    // backend SAVE
    sendToServer("/api/tables/checkin", {
        table_id: Number(t.name.replace("Table ", ""))
    });

    updateButtons(id, "running");
    runTimer(id);
    saveState();
}



/******************************************************
 * CHECK-OUT FUNCTION
 ******************************************************/
function checkOut(id) {
    let t = tables.find(x => x.id === id);
    if (!t) return;

    // last history entry (required)
    let h = t.history[t.history.length - 1];
    if (!h) {
        alert("No running session found!");
        return;
    }

    // stop
    t.isRunning = false;

    h.checkout = Date.now();
    h.endMs = h.checkout;

    // time calculation
    let diff = Math.floor((h.endMs - h.startMs) / 1000);
    h.playSeconds = diff;

    // amount calculation
    h.amount = Math.floor((diff / 3600) * t.selectedRate);
    h.canteenAmount = t.canteenTotal || 0;

    // total
    const sessionTotal = h.amount + h.canteenAmount;
    h.total = sessionTotal;

    // SEND to server ONCE
    sendToServer("/api/tables/checkout", {
        table_id: Number(t.name.replace("Table ", "")),
        total_amount: sessionTotal
    });

    saveState();
    renderTables();
}





/******************************************************
 * TIMER — (1 SEC = 1 MIN CHARGE FIX)
 ******************************************************/
function runTimer(id) {
    let t = tables.find(x => x.id === id);
    if (!t || !t.isRunning) return;

    t.playSeconds = Math.floor((Date.now() - t.checkinTime) / 1000);

    // FIXED BILLING
    t.liveAmount = Math.ceil(t.playSeconds / 60) * t.selectedRate;

    updateDisplay(id);
    saveState();

    setTimeout(() => runTimer(id), 1000);
}

/******************************************************
 * UPDATE DISPLAY
 ******************************************************/
function updateDisplay(id) {
    let t = tables.find(x => x.id === id);

    document.getElementById(`checkin-${id}`).innerText = t.checkinTime ? formatTime(t.checkinTime) : "--:--:--";
    document.getElementById(`checkout-${id}`).innerText = t.checkoutTime ? formatTime(t.checkoutTime) : "--:--:--";
    document.getElementById(`playtime-${id}`).innerText = formatSeconds(t.playSeconds);
    document.getElementById(`amount-${id}`).innerText = t.liveAmount;
}

/******************************************************
 * FORMAT HELPERS
 ******************************************************/
function formatTime(ms){ return new Date(ms).toLocaleTimeString(); }
function pad(n){ return n<10 ? "0"+n : n; }
function formatSeconds(sec){
    let h = Math.floor(sec/3600);
    let m = Math.floor((sec%3600)/60);
    let s = sec%60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/******************************************************
 * BUTTON STATUS LOGIC (FULL FIX)
 ******************************************************/
function updateButtons(id, mode) {

    let checkInBtn = document.getElementById(`checkinBtn-${id}`);
    let checkOutBtn = document.getElementById(`checkoutBtn-${id}`);
    let afterRow = document.getElementById(`afterRow-${id}`);

    let histBtn = document.getElementById(`historyBtn-${id}`);
    let editBtn = document.getElementById(`editBtn-${id}`);
    let delBtn = document.getElementById(`deleteBtn-${id}`);

    let canteenBtn = document.getElementById(`canteenBtn-${id}`);
    let shiftBtn = document.getElementById(`shiftBtn-${id}`);

    if (mode === "running") {

        checkInBtn.classList.add("hidden");
        checkOutBtn.classList.remove("hidden");
        afterRow.classList.add("hidden");

        histBtn.classList.add("hidden");
        editBtn.classList.add("hidden");
        delBtn.classList.add("hidden");

        canteenBtn.classList.remove("hidden");
        shiftBtn.classList.remove("hidden");
    }
    else if (mode === "afterCheckout") {

        checkInBtn.classList.add("hidden");
        checkOutBtn.classList.add("hidden");
        afterRow.classList.remove("hidden");

        histBtn.classList.remove("hidden");
        editBtn.classList.remove("hidden");
        delBtn.classList.remove("hidden");

        canteenBtn.classList.add("hidden");
        shiftBtn.classList.add("hidden");
    }
    else {
        checkInBtn.classList.remove("hidden");
        checkOutBtn.classList.add("hidden");
        afterRow.classList.add("hidden");

        histBtn.classList.remove("hidden");
        editBtn.classList.remove("hidden");
        delBtn.classList.remove("hidden");

        canteenBtn.classList.add("hidden");
        shiftBtn.classList.add("hidden");
    }
}
/******************************************************
 * BILL POPUP — SHOW BILL FOR A TABLE
 ******************************************************/
function showBill(id) {
    let t = tables.find(x => x.id === id);

    let academy = localStorage.getItem("academyName") || "Rasson Snooker Academy";
    let branch = localStorage.getItem("branch") || "Rasson 1";

    let checkin = t.checkinTime ? new Date(t.checkinTime).toLocaleString() : "--";
    let checkout = t.checkoutTime ? new Date(t.checkoutTime).toLocaleString() : "--";
    let playtime = formatSeconds(t.playSeconds);

    let bill = document.getElementById("billDetails");

bill.innerHTML = `
<div class="bill-print-box">

    <img src="../assets/bill logo.png" class="bill-logo" style="width:200px; margin-top:5px;">

    <p class="title">${academy}</p>
    <p>${branch}</p>
     <div class="bill-separator"></div>

    <p><b>${t.name}</b></p>
    <div class="bill-separator"></div>

    <p>Check-in: ${checkin}</p>
    <p>Checkout: ${checkout}</p>
    <p>Play Time: ${playtime}</p>

    <div class="bill-separator"></div>

    <p>Amount: ${t.liveAmount}</p>
    <p>Canteen: ${t.canteenTotal}</p>
    <p><b>Total Amount: ${t.liveAmount + t.canteenTotal}</b></p>

     <div class="bill-separator"></div>

    <p> Scan for Subscribe</p>
    <img src="../assets/qr bill.png" class="qr-bill" style="width:100px; margin-top:8px;">

    <div class="bill-separator"></div>

    <p>Thanks for visit</p>


</div>
`;




    document.getElementById("billPopup").classList.remove("hidden");

    document.getElementById("paidBtn").onclick = () => completePayment(id);
    document.getElementById("cancelBillBtn").onclick =
        () => document.getElementById("billPopup").classList.add("hidden");
}

function completePayment(id) {

    let t = tables.find(x => x.id === id);

    // Find last history entry (latest checkout)
    let last = t.history[t.history.length - 1];

    if (!last) {
        alert("No bill found.");
        return;
    }

    // Mark as paid
    last.paid = true;
    last.paymentTime = Date.now();  // ⭐ VERY IMPORTANT


    saveState();

    // Auto print bill
    window.print();

    // Close bill popup
    document.getElementById("billPopup").classList.add("hidden");

    // Reset table UI (ready for new check-in)
    updateButtons(id, "idle");
    updateDisplay(id);
}

/******************************************************
 * 🟢 BILL POPUP FROM SESSION HISTORY
 ******************************************************/
function openBillFromHistory(tableId, historyIndex) {
    let t = tables.find(x => x.id === tableId);

    if (!t || !t.history || !t.history[historyIndex]) {
        alert("History record not found!");
        return;
    }

    let h = t.history[historyIndex]; // Selected history row

    let academy = localStorage.getItem("academyName") || "Rasson Snooker Academy";
    let branch = localStorage.getItem("branch") || "Rasson 1";

    // Build bill details exactly like showBill()
    let bill = document.getElementById("billDetails");
    bill.innerHTML = `
    <div class="bill-print-box">

        <img src="../assets/bill logo.png" class="bill-logo" style="width:200px; margin-top:5px;">

        <p class="title">${academy}</p>
        <p>${branch}</p>
        <div class="bill-separator"></div>

        <p><b>${t.name}</b></p>
        <div class="bill-separator"></div>

        <p>Check-in: ${new Date(h.checkin).toLocaleString()}</p>
        <p>Checkout: ${new Date(h.checkout).toLocaleString()}</p>
        <p>Play Time: ${formatSeconds(h.playSeconds)}</p>

        <div class="bill-separator"></div>

        <p>Amount: ${h.amount}</p>
        <p>Canteen: ${h.canteenAmount}</p>
        <p><b>Total Amount: ${h.total}</b></p>

        <div class="bill-separator"></div>

        <p>Scan for Subscribe</p>
        <img src="../assets/qr bill.png" class="qr-bill" style="width:100px; margin-top:8px;">

        <div class="bill-separator"></div>

        <p>Thanks for visit</p>
    </div>
    `;

    // Show popup
    document.getElementById("billPopup").classList.remove("hidden");

    // On PAY — mark history entry as paid
    document.getElementById("paidBtn").onclick = () => {

        h.paid = true;
        saveState();

        window.print();

        document.getElementById("billPopup").classList.add("hidden");
    };

    document.getElementById("cancelBillBtn").onclick =
        () => document.getElementById("billPopup").classList.add("hidden");
}



/******************************************************
 * CANTEEN POPUP — FOOD ITEMS
 ******************************************************/
function openCanteen(id) {
    let t = tables.find(x => x.id === id);

    let list = document.getElementById("canteenList");
    list.innerHTML = `
        <button class="neon-btn" onclick="addCanteen(${id}, 50)">Tea - 50</button><br><br>
        <button class="neon-btn" onclick="addCanteen(${id}, 100)">Cold Drink - 100</button><br><br>
        <button class="neon-btn" onclick="addCanteen(${id}, 150)">Chips - 150</button>
    `;

    document.getElementById("canteenPopup").classList.remove("hidden");

    document.getElementById("closeCanteenBtn").onclick =
        () => document.getElementById("canteenPopup").classList.add("hidden");
}

function addCanteen(id, amount) {
    let t = tables.find(x => x.id === id);
    t.canteenTotal += amount;

    updateDisplay(id);
    saveState();
}

/******************************************************
 * EDIT TABLE POPUP
 ******************************************************/
function editTable(id) {
    let t = tables.find(x => x.id === id);
    editTargetId = id;

    document.getElementById("editTableName").value = t.name;
    document.getElementById("editFrameRate").value = t.frameRate;
    document.getElementById("editCenturyRate").value = t.centuryRate;

    document.getElementById("editTablePopup").classList.remove("hidden");

    document.getElementById("saveEditBtn").onclick = updateTable;
    document.getElementById("cancelEditBtn").onclick = () =>
        document.getElementById("editTablePopup").classList.add("hidden");
}

function updateTable() {
    let t = tables.find(x => x.id === editTargetId);

    t.name = document.getElementById("editTableName").value.trim();
    t.frameRate = Number(document.getElementById("editFrameRate").value);
    t.centuryRate = Number(document.getElementById("editCenturyRate").value);

    saveState();
    renderTables();

    document.getElementById("editTablePopup").classList.add("hidden");
}

/******************************************************
 * DELETE TABLE POPUP
 ******************************************************/
function deleteTableOpen(id) {
    deleteTargetId = id;
    document.getElementById("deletePopup").classList.remove("hidden");

    document.getElementById("confirmDeleteBtn").onclick = deleteTableConfirm;
    document.getElementById("cancelDeleteBtn").onclick =
        () => document.getElementById("deletePopup").classList.add("hidden");
}

function deleteTableConfirm() {
    tables = tables.filter(x => x.id !== deleteTargetId);

    saveState();
    renderTables();

    document.getElementById("deletePopup").classList.add("hidden");
}

/******************************************************
 * OPEN HISTORY POPUP — FULL BACKEND + OFFLINE SUPPORT
 ******************************************************/
async function openHistory(id) {

    let t = tables.find(x => x.id === id);
    let body = document.getElementById("historyTableBody");
    body.innerHTML = "";

    // 1️⃣ SERVER HISTORY TRY FIRST
    let branch = localStorage.getItem("branch");
    let serverHistory = [];

    try {
        // Extract real table number from name: "Table 3" → 3
let tableNumber = Number(t.name.replace("Table ", ""));

let res = await fetch(
    `http://localhost:5000/api/history/table?table_id=${tableNumber}&branch=${branch}`
);
;
        if (res.ok) serverHistory = await res.json();
    } catch (e) {
        console.log("⚠ Server unavailable → using local history");
    }

    // 2️⃣ PICK SERVER OR LOCAL
let historyList = serverHistory;


    if (!historyList || historyList.length === 0) {
        body.innerHTML = `<tr><td colspan="9" style="text-align:center;">No history found</td></tr>`;
        document.getElementById("historyPopup").classList.remove("hidden");
        return;
    }

    // 3️⃣ RENDER ROWS
    historyList.forEach((h, index) => {
        body.innerHTML += `
            <tr>
                <td>${index + 1}</td>

                <td>${new Date(h.checkin || h.start_time).toLocaleString()}</td>
                <td>${h.checkout || h.end_time ? new Date(h.checkout || h.end_time).toLocaleString() : "-"}</td>

                <td>${formatSeconds(h.playSeconds || h.play_seconds || 0)}</td>

                <td>${h.rate_type || h.rate}</td>
                <td>${h.amount || h.total_amount || 0}</td>
                <td>${h.canteenAmount || h.canteen_amount || 0}</td>

                <td>${h.total || (h.total_amount + h.canteen_amount)}</td>

                <td>
                    ${
                        h.paid
                        ? `<button class="paid-btn" disabled>PAID</button>`
                        : `<button class="unpaid-btn" onclick="openBillFromHistory(${id}, ${index})">UNPAID</button>`
                    }
                </td>
            </tr>
        `;
    });

    // 4️⃣ SHOW POPUP
    document.getElementById("historyPopup").classList.remove("hidden");

    document.getElementById("closeHistoryBtn").onclick =
        () => document.getElementById("historyPopup").classList.add("hidden");
}




/******************************************************
 * SHIFT TABLE POPUP (OPEN)
 ******************************************************/
function openTableShift(id) {
    let t = tables.find(x => x.id === id);

    if (!t.isRunning) {
        alert("Only running tables can be shifted.");
        return;
    }

    window._shiftSourceTable = id;

    let sel = document.getElementById("shiftTableSelect");
    sel.innerHTML = "";

    tables.forEach(tb => {
        if (!tb.isRunning && tb.id !== id) {
            sel.innerHTML += `<option value="${tb.id}">${tb.name}</option>`;
        }
    });

    if (sel.innerHTML === "") {
        alert("No free tables available to shift.");
        return;
    }

    document.getElementById("shiftTablePopup").classList.remove("hidden");

    document.getElementById("cancelShiftTableBtn").onclick =
        () => document.getElementById("shiftTablePopup").classList.add("hidden");

    document.getElementById("confirmShiftTableBtn").onclick =
        shiftPlayerToNewTable;
}

/******************************************************
 * SHIFT PLAYER TO NEW TABLE (MAIN LOGIC)
 ******************************************************/
function shiftPlayerToNewTable() {

    let oldId = window._shiftSourceTable;
    let newId = Number(document.getElementById("shiftTableSelect").value);

    let oldT = tables.find(x => x.id === oldId);
    let newT = tables.find(x => x.id === newId);

    // Move session to new table
    newT.isRunning = true;
    newT.checkinTime = oldT.checkinTime;
    newT.playSeconds = oldT.playSeconds;
    newT.liveAmount = oldT.liveAmount;
    newT.canteenTotal = oldT.canteenTotal;
    newT.selectedRate = oldT.selectedRate;

    runTimer(newT.id);

    // Reset old table
    oldT.isRunning = false;
    oldT.checkinTime = null;
    oldT.checkoutTime = null;
    oldT.playSeconds = 0;
    oldT.liveAmount = 0;
    oldT.canteenTotal = 0;

    saveState();
    renderTables();

    document.getElementById("shiftTablePopup").classList.add("hidden");

    alert(`Shifted successfully to ${newT.name}`);
}
/******************************************************
 * SHIFT BUTTON BINDING
 ******************************************************/
function bindShiftButtons() {

    document.getElementById("shiftCloseBtn").onclick = openShiftSummary;

    document.getElementById("confirmShiftCloseBtn").onclick = () => {

        let btn = document.getElementById("shiftCloseBtn");

        if (btn.innerText.includes("Day")) {
            closeDay();
        }
        else if (btn.innerText.includes("1")) {
            closeShift1();
        }
        else {
            closeShift2();
        }
    };

    document.getElementById("cancelShiftSummaryBtn").onclick =
        () => hidePopup("shiftSummaryPopup");
}

/******************************************************
 * POPUP SHOW/HIDE
 ******************************************************/
function showPopup(id) {
    document.getElementById(id).classList.remove("hidden");
}
function hidePopup(id) {
    document.getElementById(id).classList.add("hidden");
}

/******************************************************
 * OPEN SHIFT SUMMARY POPUP (Shift1 + Shift2 + Combined)
 ******************************************************/
function openShiftSummary() {

    let btn = document.getElementById("shiftCloseBtn");
    let summaryBody = document.getElementById("shiftSummaryBody");
    let title = document.getElementById("shiftSummaryTitle");



    let now = new Date().toLocaleString();

    
    


    // Title Logic
    if (btn.innerText.includes("Day")) {
        title.innerText = "Day Summary";
        document.getElementById("confirmShiftCloseBtn").innerText = "Close Day";
    } else {
        title.innerText = "Shift Summary";
        document.getElementById("confirmShiftCloseBtn").innerText = "Close Shift";
    }

// Load frozen snapshots of shift1 & shift2
let s1 = JSON.parse(localStorage.getItem("shift1") || "{}");
let s2 = JSON.parse(localStorage.getItem("shift2") || "{}");

// Build Combined summary by adding both shift values
let combined = {
    gameTotal: (s1.gameTotal || 0) + (s2.gameTotal || 0),
    canteenTotal: (s1.canteenTotal || 0) + (s2.canteenTotal || 0),
    gameCollection: (s1.gameCollection || 0) + (s2.gameCollection || 0),
    canteenCollection: (s1.canteenCollection || 0) + (s2.canteenCollection || 0),
    gameBalance: (s1.gameBalance || 0) + (s2.gameBalance || 0),
    canteenBalance: (s1.canteenBalance || 0) + (s2.canteenBalance || 0),
    expenses: (s1.expenses || 0) + (s2.expenses || 0)
};

combined.closingCash = 
    (combined.gameCollection + combined.canteenCollection) - combined.expenses;

// APPLY to HTML table
summaryBody.innerHTML = `
    <tr>
        <td>Shift 1</td>
        <td>${s1.gameTotal || 0}</td>
        <td>${s1.canteenTotal || 0}</td>
        <td>${s1.gameCollection || 0}</td>
        <td>${s1.canteenCollection || 0}</td>
        <td>${s1.gameBalance || 0}</td>
        <td>${s1.canteenBalance || 0}</td>
        <td>${s1.expenses || 0}</td>
        <td>${s1.closingCash || 0}</td>
        <td>${s1.openTime || "-"}</td>
        <td>${s1.closeTime || "-"}</td>
    </tr>

    <tr>
        <td>Shift 2</td>
        <td>${s2.gameTotal || 0}</td>
        <td>${s2.canteenTotal || 0}</td>
        <td>${s2.gameCollection || 0}</td>
        <td>${s2.canteenCollection || 0}</td>
        <td>${s2.gameBalance || 0}</td>
        <td>${s2.canteenBalance || 0}</td>
        <td>${s2.expenses || 0}</td>
        <td>${s2.closingCash || 0}</td>
        <td>${s2.openTime || "-"}</td>
        <td>${s2.closeTime || "-"}</td>
    </tr>

    <tr class="combined-row">
        <td>Combined</td>
        <td>${combined.gameTotal}</td>
        <td>${combined.canteenTotal}</td>
        <td>${combined.gameCollection}</td>
        <td>${combined.canteenCollection}</td>
        <td>${combined.gameBalance}</td>
        <td>${combined.canteenBalance}</td>
        <td>${combined.expenses}</td>
        <td>${combined.closingCash}</td>
        <td>-</td>
        <td>-</td>
    </tr>
`;


    showPopup("shiftSummaryPopup");
}

/******************************************************
 * SHIFT 1 CLOSE (running tables allowed)
 ******************************************************/
function closeShift1() {

    let now = Date.now();
    let startMs = Number(localStorage.getItem("shift1Start"));

    if (!startMs) {
        let firstEntry = Infinity;

        tables.forEach(t => {
            t.history.forEach(h => {
                let chk = Number(h.checkin);
                if (isNaN(chk)) chk = new Date(h.checkin).getTime();
                if (chk < firstEntry) firstEntry = chk;
            });
        });

        startMs = (firstEntry !== Infinity) ? firstEntry : Date.now();
        localStorage.setItem("shift1Start", startMs);
    }

    let endMs = now;

    let snap = calculateShiftSnapshot(startMs, endMs);

    shift1 = {
        shift: 1,
        openTime: new Date(startMs).toLocaleString(),
        closeTime: new Date(endMs).toLocaleString(),
        startMs: startMs,
        endMs: endMs,
        ...snap
    };

    localStorage.setItem("shift1", JSON.stringify(shift1));

    document.getElementById("shiftCloseBtn").innerText = "Shift 2 Close";
    hidePopup("shiftSummaryPopup");
}





/******************************************************
 * SHIFT 2 CLOSE (no running tables allowed)
 ******************************************************/
function closeShift2() {

    if (tables.some(t => t.isRunning)) {
        alert("Checkout all tables before closing Shift 2!");
        return;
    }

    let now = Date.now();

    let s1 = JSON.parse(localStorage.getItem("shift1") || "{}");

    let startMs = Number(s1.endMs);
    if (!startMs) {
        alert("Shift 1 must be closed first!");
        return;
    }

    let endMs = now;

    let snap = calculateShiftSnapshot(startMs, endMs);

    shift2 = {
        shift: 2,
        openTime: new Date(startMs).toLocaleString(),
        closeTime: new Date(endMs).toLocaleString(),
        startMs: startMs,
        endMs: endMs,
        ...snap
    };

    localStorage.setItem("shift2", JSON.stringify(shift2));

    document.getElementById("shiftCloseBtn").innerText = "Day Close";
    hidePopup("shiftSummaryPopup");
}




/******************************************************
 * DAY CLOSE — RESET EVERYTHING + NEW DAY START
 ******************************************************/
/******************************************************
 * DAY CLOSE — RESET EVERYTHING + NEW DAY START
 ******************************************************/
function closeDay() {

    let s1 = JSON.parse(localStorage.getItem("shift1") || "null");
    let s2 = JSON.parse(localStorage.getItem("shift2") || "null");

    if (!s1 || !s2) {
        alert("Please close Shift 1 and Shift 2 before Day Close.");
        return;
    }

    // ⭐ COMBINED SUMMARY
    let combined = {
        gameTotal: (s1.gameTotal || 0) + (s2.gameTotal || 0),
        canteenTotal: (s1.canteenTotal || 0) + (s2.canteenTotal || 0),
        gameCollection: (s1.gameCollection || 0) + (s2.gameCollection || 0),
        canteenCollection: (s1.canteenCollection || 0) + (s2.canteenCollection || 0),
        gameBalance: (s1.gameBalance || 0) + (s2.gameBalance || 0),
        canteenBalance: (s1.canteenBalance || 0) + (s2.canteenBalance || 0),
        expenses: (s1.expenses || 0) + (s2.expenses || 0)
    };

    combined.closingCash =
        (combined.gameCollection + combined.canteenCollection) - combined.expenses;

    // ⭐ SAVE DAY HISTORY
    let dayList = JSON.parse(localStorage.getItem("dayHistory") || "[]");
    dayList.push({
        date: new Date().toLocaleDateString(),
        shift1: s1,
        shift2: s2,
        combined: combined
    });
    localStorage.setItem("dayHistory", JSON.stringify(dayList));

    // ⭐ SAVE DAY RANGE
    let dayRanges = JSON.parse(localStorage.getItem("dayRanges") || "[]");
    dayRanges.push({
        start: s1.openTime,
        end: s2.closeTime
    });
    localStorage.setItem("dayRanges", JSON.stringify(dayRanges));

    // ⭐ SEND TO BACKEND
    sendToServer("/api/day/close", {
        shift1: s1,
        shift2: s2,
        combined
    });

    // ⭐ RESET SHIFT DATA
    localStorage.removeItem("shift1Start");
    localStorage.removeItem("shift1");
    localStorage.removeItem("shift2");
    localStorage.removeItem("dayStart");
    localStorage.removeItem("expenses");

    // ⭐ RESET ALL TABLES & CLEAR HISTORY
    tables.forEach(t => {
        t.isRunning = false;
        t.checkinTime = null;
        t.checkoutTime = null;
        t.playSeconds = 0;
        t.liveAmount = 0;
        t.canteenTotal = 0;
        t.history = [];         // <---- MOST IMPORTANT
    });

    saveState();
    renderTables();

    document.getElementById("shiftCloseBtn").innerText = "Shift 1 Close";

    hidePopup("shiftSummaryPopup");

    alert("Day Closed Successfully! New Day Started Fresh.");
}




/******************************************************
 * SHIFT HELPERS
 ******************************************************/
function getGameTotal() {
    return tables.reduce((sum, t) => sum + t.liveAmount, 0);
}

function getTotalCollection() {
    return tables.reduce((sum, t) => sum + (t.liveAmount + t.canteenTotal), 0);
}

function calculateShiftSnapshot(startTime, endTime) {

    startTime = Number(startTime);
    endTime = Number(endTime);

    if (isNaN(startTime)) startTime = new Date(startTime).getTime();
    if (isNaN(endTime)) endTime = new Date(endTime).getTime();

    let gameTotal = 0;
    let canteenTotal = 0;
    let gameCollection = 0;
    let canteenCollection = 0;
    let gameBalance = 0;
    let canteenBalance = 0;

    tables.forEach(t => {
        t.history.forEach(h => {

            let hIn = Number(h.checkin);
            let hOut = Number(h.checkout);

            if (isNaN(hIn)) hIn = new Date(h.checkin).getTime();
            if (isNaN(hOut)) hOut = new Date(h.checkout).getTime();

            let g = Number(h.amount || 0);
            let c = Number(h.canteenAmount || 0);

            // ⭐ CASE 1 — PLAYED INSIDE THIS SHIFT
            if (hIn >= startTime && hOut <= endTime) {

                gameTotal += g;
                canteenTotal += c;

                if (h.paid) {
                    gameCollection += g;
                    canteenCollection += c;
                } else {
                    gameBalance += g;
                    canteenBalance += c;
                }
            }

            // ⭐ CASE 2 — SESSION WAS FROM PREVIOUS SHIFT BUT PAID IN THIS SHIFT
            else if (!h.paid && h.paymentTime &&
                     h.paymentTime >= startTime && h.paymentTime <= endTime) {

                gameCollection += g;
                canteenCollection += c;

                // Balance already counted in previous shift — DO NOT add again
            }
        });
    });

    // EXPENSES
    let expensesArr = JSON.parse(localStorage.getItem("expenses") || "[]");
    let expenses = expensesArr
        .filter(e => e.time >= startTime && e.time <= endTime)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    let closingCash = (gameCollection + canteenCollection) - expenses;

    return {
        gameTotal,
        canteenTotal,
        gameCollection,
        canteenCollection,
        gameBalance,
        canteenBalance,
        expenses,
        closingCash
    };
}



/******************************************************
 * HISTORY BUTTON BINDING
 ******************************************************/
function bindHistoryButtons() {

    // DAY HISTORY
    document.getElementById("dayHistoryBtn").onclick = openDayHistory;
    document.getElementById("cancelDayHistoryBtn").onclick =
        () => hidePopup("dayHistoryPopup");

    document.getElementById("printDayHistoryBtn").onclick =
        () => window.print();

    // TABLE HISTORY
    document.getElementById("tableHistoryBtn").onclick = openTableHistory;
    document.getElementById("cancelTableHistoryBtn").onclick =
        () => hidePopup("tableHistoryPopup");

    document.getElementById("printTableHistoryBtn").onclick =
        () => window.print();
}

/******************************************************
 * 🟢 OPEN DAY HISTORY POPUP
 ******************************************************/
function openDayHistory() {

    let sel = document.getElementById("dayHistoryDateSelect");
    sel.innerHTML = "";

    let dayRangesList = JSON.parse(localStorage.getItem("dayRanges") || "[]");

    dayRangesList.forEach(r => {
        sel.innerHTML += `<option>${r.start} → ${r.end}</option>`;
    });

    document.getElementById("dayHistoryBranch").innerText =
        "Branch: " + (localStorage.getItem("branch") || "R1");

    loadDaySummary();

    // ⭐ IMPORTANT: reload summary when user selects a day
    sel.onchange = loadDaySummary;

    showPopup("dayHistoryPopup");
}


/******************************************************
 * 🟢 BUILD DAY SUMMARY (SHIFT 1 + SHIFT 2 + COMBINED)
 ******************************************************/
function loadDaySummary() {

    let dayList = JSON.parse(localStorage.getItem("dayHistory") || "[]");
    if (dayList.length === 0) return;

    let sel = document.getElementById("dayHistoryDateSelect");
    let index = sel.selectedIndex;

    let day = dayList[index];

    let s1 = day.shift1;
    let s2 = day.shift2;
    let c = day.combined;

    document.getElementById("dayCombinedBody").innerHTML = `
        <tr><td>Shift 1</td>
            <td>${s1.gameTotal}</td><td>${s1.canteenTotal}</td>
            <td>${s1.gameCollection}</td><td>${s1.canteenCollection}</td>
            <td>${s1.gameBalance}</td><td>${s1.canteenBalance}</td>
            <td>${s1.expenses}</td><td>${s1.closingCash}</td>
            <td>${s1.openTime}</td><td>${s1.closeTime}</td>
        </tr>

        <tr><td>Shift 2</td>
            <td>${s2.gameTotal}</td><td>${s2.canteenTotal}</td>
            <td>${s2.gameCollection}</td><td>${s2.canteenCollection}</td>
            <td>${s2.gameBalance}</td><td>${s2.canteenBalance}</td>
            <td>${s2.expenses}</td><td>${s2.closingCash}</td>
            <td>${s2.openTime}</td><td>${s2.closeTime}</td>
        </tr>

        <tr><td>Combined</td>
            <td>${c.gameTotal}</td><td>${c.canteenTotal}</td>
            <td>${c.gameCollection}</td><td>${c.canteenCollection}</td>
            <td>${c.gameBalance}</td><td>${c.canteenBalance}</td>
            <td>${c.expenses}</td><td>${c.closingCash}</td>
            <td>${day.date}</td><td>-</td>
        </tr>
    `;
}


/******************************************************
 * 🟢 BUILD A SINGLE SUMMARY ROW
 ******************************************************/
function buildDayRow(s) {
    return `
        <tr>
            <td>${s.gameTotal}</td>
            <td>${s.canteenTotal}</td>
            <td>${s.gameCollection}</td>
            <td>${s.canteenCollection}</td>
            <td>${s.gameBalance}</td>
            <td>${s.canteenBalance}</td>
            <td>${s.expenses}</td>
            <td>${s.closingCash}</td>
        </tr>
    `;
}


/******************************************************
 * 🟢 OPEN TABLE HISTORY POPUP
 ******************************************************/
function openTableHistory() {

    let dateSel = document.getElementById("tableHistoryDateSelect");
    dateSel.innerHTML = "";

    let dayRangesList = JSON.parse(localStorage.getItem("dayRanges") || "[]");
    dayRangesList.forEach(r => {
        dateSel.innerHTML += `<option>${r.start} → ${r.end}</option>`;
    });

    let tableSel = document.getElementById("tableHistoryTableSelect");
    tableSel.innerHTML = tables
        .map(t => `<option value="${t.id}">${t.name}</option>`)
        .join("");

    document.getElementById("tableHistoryBranch").innerText =
        "Branch: " + (localStorage.getItem("branch") || "Rasson Snooker Academy");

    // FIRST LOAD
    loadSelectedTableHistory();

    // ⭐ FIX — UPDATE ON BOTH CHANGES
    document.getElementById("tableHistoryTableSelect").onchange = loadSelectedTableHistory;
    document.getElementById("tableHistoryDateSelect").onchange = loadSelectedTableHistory;

    showPopup("tableHistoryPopup");
}

/******************************************************
 * 🟢 LOAD SUMMARY FOR SELECTED TABLE
 ******************************************************/
function loadSelectedTableHistory() {

    let tableId = Number(document.getElementById("tableHistoryTableSelect").value);
    let t = tables.find(x => x.id === tableId);

    if (!t) return;

// GET SELECTED DAY RANGE
let daySel = document.getElementById("tableHistoryDateSelect").value;
let [startLabel, endLabel] = daySel.split(" → ");

let dayStart = new Date(startLabel).getTime();
let dayEnd   = new Date(endLabel).getTime();

// GET SHIFT SNAPSHOT
let t1 = getTableShiftTotals(t, 1, dayStart, dayEnd);
let t2 = getTableShiftTotals(t, 2, dayStart, dayEnd);


    document.getElementById("tableShift1Body").innerHTML =
        buildTableHistoryRow(t, t1);

    document.getElementById("tableShift2Body").innerHTML =
        buildTableHistoryRow(t, t2);

    let combined = {
        time: t1.time + t2.time,
        game: t1.game + t2.game,
        canteen: t1.canteen + t2.canteen,
        total: t1.total + t2.total
    };

    document.getElementById("tableCombinedBody").innerHTML =
        buildTableHistoryRow(t, combined);
}

/******************************************************
 * 🟢 CALCULATE TABLE SUMMARY FOR SPECIFIC SHIFT
 ******************************************************/
function getTableShiftTotals(t, shiftNum, dayStart, dayEnd) {

    let s = JSON.parse(localStorage.getItem(`shift${shiftNum}`) || "{}");

    if (!s.startMs || !s.endMs)
        return { time: 0, game: 0, canteen: 0, total: 0 };

    let start = Number(s.startMs);
    let end   = Number(s.endMs);

    let time = 0, game = 0, canteen = 0, total = 0;

    t.history.forEach(h => {

        let hIn = Number(h.checkin);
        let hOut = Number(h.checkout);

        if (isNaN(hIn)) hIn = new Date(h.checkin).getTime();
        if (isNaN(hOut)) hOut = new Date(h.checkout).getTime();

        if (hIn >= start && hOut <= end) {
            time += Number(h.playSeconds || 0);
            game += Number(h.amount || 0);
            canteen += Number(h.canteenAmount || 0);
            total += Number(h.total || 0);
        }
    });

    return { time, game, canteen, total };
}



/******************************************************
 * 🟢 BUILD TABLE HISTORY ROW
 ******************************************************/
function buildTableHistoryRow(t, d) {
    return `
        <tr>
            <td>${t.name}</td>
            <td>${formatSeconds(d.time || 0)}</td>
            <td>${d.game || 0}</td>
            <td>${d.canteen || 0}</td>
            <td>${d.total || 0}</td>
        </tr>
    `;
}

/******************************************************
 * TABLE HISTORY PAGINATION (FINAL FIX)
 ******************************************************/

let historyPage = 1;
let historyPerPage = 5;  // 5 rows per page (you can change this)

function nextPage() {
    let tableId = Number(document.getElementById("tableHistoryTableSelect").value);
    let t = tables.find(x => x.id === tableId);

    if (!t || t.history.length === 0) return;

    let maxPage = Math.ceil(t.history.length / historyPerPage);
    if (historyPage < maxPage) {
        historyPage++;
        renderHistoryPage();
    }
}

function prevPage() {
    if (historyPage > 1) {
        historyPage--;
        renderHistoryPage();
    }
}

function renderHistoryPage() {

    let tableId = Number(document.getElementById("tableHistoryTableSelect").value);
    let t = tables.find(x => x.id === tableId);

    let body = document.getElementById("historyTableBody");
    body.innerHTML = "";

    if (!t || t.history.length === 0) {
        body.innerHTML = "<tr><td colspan='9'>No history found.</td></tr>";
        return;
    }

    let start = (historyPage - 1) * historyPerPage;
    let end = start + historyPerPage;

    let pageRows = t.history.slice(start, end);

    pageRows.forEach((h, index) => {
        body.innerHTML += `
            <tr>
                <td>${start + index + 1}</td>
                <td>${new Date(h.checkin).toLocaleString()}</td>
                <td>${new Date(h.checkout).toLocaleString()}</td>
                <td>${formatSeconds(h.playSeconds)}</td>
                <td>${h.rate}</td>
                <td>${h.amount}</td>
                <td>${h.canteenAmount}</td>
                <td>${h.total}</td>
                <td>
                    ${
                        h.paid
                        ? "<button disabled>PAID</button>"
                        : `<button onclick="openBillFromHistory(${tableId}, ${start + index})">UNPAID</button>`
                    }
                </td>
            </tr>
        `;
    });

    document.getElementById("historyPageNumber").innerText = historyPage;
}


/******************************************************
 * 🟢 RESTORE TIMERS ON PAGE LOAD
 ******************************************************/
function restoreTimers() {

    tables.forEach(t => {

        if (t.isRunning) {
            runTimer(t.id);
        }

        updateDisplay(t.id);
        updateButtons(t.id, t.isRunning ? "running" : "idle");
    });
}


// -----------------------------------------------
// SHIFT BACKEND SYNC FUNCTION
// -----------------------------------------------
async function syncShiftToServer(shiftObj) {
    try {
        await fetch("http://localhost:5000/api/shifts/close", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(shiftObj)
        });
    } catch (err) {
        console.log("Shift sync failed → saving offline");

        pendingQueue.push({
            url: "/api/shifts/close",
            data: shiftObj
        });

        saveQueue();
    }
}

async function loadServerHistory(id) {
    let branch = localStorage.getItem("branch");
    try {
        let res = await fetch(`http://localhost:5000/api/history/table?table_id=${id}&branch=${branch}`);
        return await res.json();
    } catch {
        return [];
    }
}


// ===============================================
// AUTO SYNC OFFLINE QUEUE EVERY 5 SEC
// ===============================================
async function syncPending() {
    if (!navigator.onLine || pendingQueue.length === 0) return;

    let copy = [...pendingQueue];
    pendingQueue = [];
    saveQueue();

    for (let job of copy) {
        try {
            await fetch("http://localhost:5000" + job.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(job.data)
            });
        } catch (e) {
            pendingQueue.push(job);
        }
    }

    saveQueue();
}




// Run sync every 5 seconds
setInterval(syncPending, 5000);
