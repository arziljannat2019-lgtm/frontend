console.log("🔥 api.js LOADED");

// Change only this if backend port changes
const API_BASE = "http://localhost:5000/api";

// Generic GET
async function apiGet(url) {
    const res = await fetch(API_BASE + url);
    if (!res.ok) throw new Error("API GET ERROR");
    return res.json();
}

// Generic POST (JSON)
async function apiPost(url, data) {
    const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("API POST ERROR");
    return res.json();
}

// Generic DELETE
async function apiDelete(url) {
    const res = await fetch(API_BASE + url, { method: "DELETE" });
    if (!res.ok) throw new Error("API DELETE ERROR");
    return res.json();
}
