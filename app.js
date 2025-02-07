const express = require("express");
const path = require("path");

const app = express();

// Heap-Speicher erhöhen (falls nötig)
if (!process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS = "--max-old-space-size=8192";
}

// Setzt den Port (Standard: 4200)
const PORT = process.env.PORT || 4200;

// Statisches Hosting für Angular-Build
const distPath = path.join(__dirname, "dist", "hr-web-app");
app.use(express.static(distPath));

// Fallback für Angular-Routing
app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "app.component.html"));
});

// Server starten
app.listen(PORT, () => {
    console.log(`✅ Angular-App läuft unter http://localhost:${PORT}`);
});
