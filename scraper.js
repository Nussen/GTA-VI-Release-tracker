import fetch from "node-fetch";
import fs from "fs";

/* =========================
   SAFE FETCH WRAPPER
========================= */
async function safeFetch(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (GTA VI Tracker Bot)"
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.text();
  } catch (err) {
    console.error("Fetch failed:", url, err.message);
    return "";
  }
}

/* =========================
   STORE CHECK (IMPROVED)
========================= */
async function checkStore(url, keywords = []) {
  const html = await safeFetch(url);
  if (!html) return false;

  const lower = html.toLowerCase();

  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/* =========================
   NEWSWIRE (SAFE PARSER)
========================= */
async function getNews() {
  const html = await safeFetch("https://www.rockstargames.com/newswire");

  if (!html) return fallbackNewswire();

  const regex = /href="(\/newswire\/[^"]+)"/g;
  const matches = [...html.matchAll(regex)];

  const seen = new Set();
  const posts = [];

  for (const m of matches) {
    const path = m[1];

    if (seen.has(path)) continue;
    seen.add(path);

    const fullUrl = "https://www.rockstargames.com" + path;

    posts.push({
      title: extractTitleFromUrl(path),
      link: fullUrl,
      summary: "Rockstar Newswire update"
    });

    if (posts.length >= 6) break;
  }

  return posts.length ? posts : fallbackNewswire();
}

/* =========================
   TITLE CLEANER
========================= */
function extractTitleFromUrl(path) {
  const clean = path
    .replace("/newswire/", "")
    .replaceAll("-", " ")
    .replace(/\//g, "");

  if (!clean) return "Rockstar Newswire Update";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/* =========================
   FALLBACK NEWSWIRE
========================= */
function fallbackNewswire() {
  return [
    {
      title: "Rockstar Newswire",
      link: "https://www.rockstargames.com/newswire",
      summary: "Latest updates from Rockstar Games"
    }
  ];
}

/* =========================
   TRAILERS (STATIC CORE)
========================= */
function getFixedTrailers() {
  return [
    {
      slot: "Trailer 1",
      title: "Grand Theft Auto VI Trailer 1",
      link: "https://www.youtube.com/watch?v=QdBZY2fkU-0",
      videoId: "QdBZY2fkU-0",
      thumbnail: "https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg"
    },
    {
      slot: "Trailer 2",
      title: "Grand Theft Auto VI Trailer 2",
      link: "https://www.youtube.com/watch?v=VQRLujxTm3c",
      videoId: "VQRLujxTm3c",
      thumbnail: "https://img.youtube.com/vi/VQRLujxTm3c/maxresdefault.jpg"
    },
    {
      slot: "Trailer 3",
      comingSoon: true
    }
  ];
}

/* =========================
   MAIN RUNNER
========================= */
async function run() {
  console.log("🔄 Running GTA VI tracker scraper...");

  const ps = await checkStore(
    "https://store.playstation.com",
    ["grand theft auto", "gta", "rockstar"]
  );

  const xbox = await checkStore(
    "https://www.xbox.com",
    ["grand theft auto", "gta", "rockstar"]
  );

  const newswire = await getNews();

  const gtaviTrailers = getFixedTrailers();

  const data = {
    releaseStatus: ps || xbox ? "🔥 PREORDER DETECTED" : "Monitoring Stores",
    prediction: "2026",

    // IMPORTANT: ISO format safe for JS Date
    releaseDate: "2026-11-19T00:00:00Z",

    playstation: ps ? "FOUND" : "Not listed",
    xbox: xbox ? "FOUND" : "Not listed",

    psPreorder: ps ? "Available 🔥" : "Not available",
    xboxPreorder: xbox ? "Available 🔥" : "Not available",

    regions: {
      US: ps || xbox ? "LIVE" : "Pending",
      Europe: ps || xbox ? "LIVE" : "Pending",
      Japan: "Pending",
      Australia: "Pending"
    },

    newswire,
    gtaviTrailers,

    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  console.log("✅ data.json updated successfully");
}

run();