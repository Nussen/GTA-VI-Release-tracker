import fetch from "node-fetch";
import fs from "fs";

/* =========================
   SAFE FETCH WRAPPER
========================= */
async function safeFetch(url) {

  try {

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) throw new Error("Request failed");

    return await res.text();

  } catch (err) {

    console.error("Fetch failed:", url);
    return "";
  }
}

/* =========================
   STORE CHECK
========================= */
async function checkStore(url, keywords = []) {

  const html = await safeFetch(url);

  if (!html) return false;

  const lower = html.toLowerCase();

  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/* =========================
   NEWSWIRE (IMPROVED PARSER)
========================= */
function getNews() {

  return [
    {
      title: "GTA VI is Now Set to Launch November 19, 2026",
      link: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026",
      summary: "Official Rockstar Games announcement"
    },

    {
      title: "Rockstar Newswire",
      link: "https://www.rockstargames.com/newswire",
      summary: "Latest Rockstar updates"
    }
  ];
}

/* =========================
   NEWSWIRE TITLE CLEANER (UPDATED)
========================= */
function cleanNewswireTitle(path) {

  const slug = path.toLowerCase();

  /* SPECIAL CASE: GTA VI ARTICLE */
  if (slug.includes("grand-theft-auto-vi-is-now-set-to-launch")) {
    return "GTA VI Launch Date Confirmed (Nov 19, 2026)";
  }

  const clean = path
    .replace("/newswire/", "")
    .replaceAll("-", " ")
    .replace("/", "");

  return clean
    ? clean.charAt(0).toUpperCase() + clean.slice(1)
    : "Rockstar Newswire Update";
}

/* =========================
   FALLBACK NEWSWIRE
========================= */
function fallbackNewswire() {
  return [
    {
      title: "Rockstar Newswire",
      link: "https://www.rockstargames.com/newswire",
      summary: "Unable to load live posts (fallback mode)"
    }
  ];
}

/* =========================
   TRAILERS
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

    releaseStatus:
      ps || xbox
        ? "🔥 PREORDER DETECTED"
        : "Monitoring Stores",

    prediction: "2026",

    releaseDate: "2026-11-19T00:00:00",

    playstation: ps ? "FOUND" : "Not listed",
    xbox: xbox ? "FOUND" : "Not listed",

    psPreorder: ps ? "AVAILABLE 🔥" : "Not available",
    xboxPreorder: xbox ? "AVAILABLE 🔥" : "Not available",

    regions: {
      US: ps || xbox ? "LIVE" : "Pending",
      Europe: ps || xbox ? "LIVE" : "Pending",
      Japan: "Pending",
      Australia: "Pending"
    },

    newswire,
    gtaviTrailers
  };

  fs.writeFileSync(
    "data.json",
    JSON.stringify(data, null, 2)
  );

  console.log("✅ data.json updated");
}

run();
