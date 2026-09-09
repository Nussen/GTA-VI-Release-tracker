import fs from "fs";

const STORE_URLS = {
  playstation: "https://store.playstation.com/en-us/product/EP1004-PPSA01547_00-GTAVISTANDARD001",
  xbox: "https://www.xbox.com/en-us/games/grand-theft-auto-vi"
};

/* =========================
   SAFE FETCH WRAPPER
========================= */
async function safeFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      signal: controller.signal
    });

    if (!res.ok) throw new Error("Request failed");

    return await res.text();
  } catch (err) {
    console.error("Fetch failed:", url, err.message);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
   STORE CHECK
========================= */
async function checkStore(url, markers = []) {

  const html = await safeFetch(url);

  if (!html) return false;

  const lower = html.toLowerCase();

  return markers.some(marker => lower.includes(marker.toLowerCase()));
}

/* =========================
   NEWSWIRE (OFFICIAL CURRENT SNAPSHOT)
========================= */
function getNews() {

  return [
    {
      title: "Grand Theft Auto VI: An Extended Look — Now Playing",
      link: "https://www.rockstargames.com/newswire/article/4k138k8okkk483/grand-theft-auto-vi-an-extended-look-now-playing",
      summary: "The official GTA VI Extended Look is now available."
    },
    {
      title: "Grand Theft Auto VI Pre-Orders Begin on June 25",
      link: "https://www.rockstargames.com/newswire/article/517oa135328155/grand-theft-auto-vi-pre-orders-begin-on-june-25",
      summary: "Pre-orders are available on PlayStation 5 and Xbox Series X|S."
    },
    {
      title: "Grand Theft Auto VI: An Extended Look",
      link: "https://www.rockstargames.com/newswire/article/9k2kaa1o3297k9/grand-theft-auto-vi-an-extended-look",
      summary: "Official announcement from Rockstar Games."
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
      title: "Grand Theft Auto VI: An Extended Look",
      link: "https://www.rockstargames.com/videos/rk721912",
      thumbnail: "https://www.rockstargames.com/VI/_next/static/media/GTAVI_An_Extended_Look_poster.0ijbsha5fo1te.jpg?akim=1&imdensity=1&imwidth=3840"
    }
  ];
}

/* =========================
   MAIN RUNNER
========================= */
async function run() {

  const ps = await checkStore(STORE_URLS.playstation, ["pre-order"]);
  const xbox = await checkStore(STORE_URLS.xbox, ["pre-order"]);

  const newswire = await getNews();

  const gtaviTrailers = getFixedTrailers();

  const data = {

    releaseStatus: ps || xbox
      ? "🔥 PREORDERS AVAILABLE"
      : "Monitoring Stores",

    prediction: "Official release date: November 19, 2026",

    releaseDate: "2026-11-19T00:00:00",

    playstation: {
      status: ps ? "Pre-order available" : "Not listed",
      url: STORE_URLS.playstation
    },
    xbox: {
      status: xbox ? "Pre-order available" : "Not listed",
      url: STORE_URLS.xbox
    },

    psPreorder: ps
      ? { status: "Available", price: "$79.99 Standard / $99.99 Ultimate" }
      : { status: "Not available" },
    xboxPreorder: xbox
      ? { status: "Available", price: "See Microsoft Store" }
      : { status: "Not available" },

    regions: {
      US: ps || xbox ? "LIVE" : "Pending",
      Europe: ps || xbox ? "LIVE" : "Pending",
      Japan: ps ? "LIVE" : "Pending",
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
