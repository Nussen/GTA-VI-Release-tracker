import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   PATH FIX (ESM SAFE)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   STATIC FRONTEND
========================= */
app.use(express.static(__dirname));

/* =========================
   SIMPLE CACHE (FAST + SAFE)
========================= */
let cachedData = null;
let lastLoad = 0;

function loadData() {
  try {
    const now = Date.now();

    // cache for 10 seconds
    if (cachedData && now - lastLoad < 10000) {
      return cachedData;
    }

    const raw = fs.readFileSync(
      path.join(__dirname, "data.json"),
      "utf-8"
    );

    cachedData = JSON.parse(raw);
    lastLoad = now;

    return cachedData;
  } catch (err) {
    console.error("Failed to load data.json:", err);

    return {
      error: "Data unavailable"
    };
  }
}

/* =========================
   MAIN API
========================= */
app.get("/api/data", (req, res) => {
  res.json(loadData());
});

/* =========================
   COMPATIBILITY LAYER
   (your frontend uses data.json directly,
   but this is for future-proofing)
========================= */
app.get("/data.json", (req, res) => {
  res.json(loadData());
});

/* =========================
   YOUTUBE ENDPOINT (SAFE MOCK)
========================= */
/*
  IMPORTANT:
  Replace this later with real YouTube Data API v3
*/
app.get("/api/youtube", (req, res) => {
  res.json({
    items: [
      {
        id: {
          videoId: "QdBZY2fkU-0"
        }
      },
      {
        id: {
          videoId: "VQRLujxTm3c"
        }
      }
    ]
  });
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 GTA VI Tracker server running on http://localhost:${PORT}`);
});