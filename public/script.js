const CHANNEL_ID = "UC6VcWc1rAoWdBCM0JxrRQ3A";

/* =========================
   BADGE SYSTEM
========================= */
function setBadge(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = text;

  el.classList.remove("online", "monitoring", "pending");
  el.classList.add(type);
}

/* =========================
   TRAILER 3 DISPLAY
========================= */
function showTrailer3(videoId) {
  loadGTAVITrailers([
    {
      slot: "Trailer 1",
      title: "Grand Theft Auto VI Trailer 1",
      link: "https://www.youtube.com/watch?v=QdBZY2fkU-0",
      thumbnail: "https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg"
    },
    {
      slot: "Trailer 2",
      title: "Grand Theft Auto VI Trailer 2",
      link: "https://www.youtube.com/watch?v=VQRLujxTm3c",
      thumbnail: "https://img.youtube.com/vi/VQRLujxTm3c/maxresdefault.jpg"
    },
    {
      slot: "Trailer 3",
      title: "Grand Theft Auto VI Trailer 3",
      link: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
  ]);
}

/* =========================
   TRAILER CHECK (SAFE)
========================= */
async function checkForNewTrailers() {
  try {
    const res = await fetch("/api/youtube");
    if (!res.ok) throw new Error("YouTube API failed");

    const data = await res.json();

    setBadge("trailerBadge", "TRAILER WATCH", "monitoring");

    const known = ["QdBZY2fkU-0", "VQRLujxTm3c"];

    const videos = data.items || [];

    const newVideo = videos.find(v =>
      v.id?.videoId && !known.includes(v.id.videoId)
    );

    if (newVideo?.id?.videoId) {
      showTrailer3(newVideo.id.videoId);
      setBadge("trailerBadge", "TRAILER 3 DROPPED", "online");
      notifyUser("🚨 Trailer 3 just dropped!");
    }

  } catch (err) {
    setBadge("trailerBadge", "OFFLINE", "pending");
    console.error("Trailer check failed:", err);
  }
}

/* OPTIONAL LOOP (DISABLED UNTIL BACKEND EXISTS) */
// setInterval(checkForNewTrailers, 60000);

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();

    /* SAFE ELEMENTS */
    const releaseStatus = document.getElementById("releaseStatus");
    const prediction = document.getElementById("prediction");

    if (releaseStatus) {
      releaseStatus.innerText = data.releaseStatus || "Loading...";
    }

    if (prediction) {
      prediction.innerText = data.prediction || "";
    }

    const psStatus = document.getElementById("psStatus");
    const xboxStatus = document.getElementById("xboxStatus");

    if (psStatus) psStatus.innerText = data.playstation || "";
    if (xboxStatus) xboxStatus.innerText = data.xbox || "";

        /* =========================
       PREORDER STATUS (FIXED)
       IMPORTANT: "Not available" no longer turns green
    ========================= */

    const psPreorder = document.getElementById("psPreorder");
    const xboxPreorder = document.getElementById("xboxPreorder");

    function applyStatus(el, text) {
      if (!el) return;

      el.innerText = text;

      el.classList.remove("available", "unavailable");

      const normalized = (text || "").toLowerCase();

      if (normalized.includes("available")) {
        el.classList.add("available");
      } else {
        el.classList.add("unavailable");
      }
    }

    applyStatus(psPreorder, data.psPreorder);
    applyStatus(xboxPreorder, data.xboxPreorder);

    /* =========================
       REGIONS
    ========================= */
    loadRegions(data.regions || {});

    /* =========================
       NEWSWIRE
    ========================= */
    loadNewswire(data.newswire || []);

    /* =========================
       TRAILERS (SAFE FALLBACK)
    ========================= */
    loadGTAVITrailers(
      Array.isArray(data.gtaviTrailers) && data.gtaviTrailers.length
        ? data.gtaviTrailers
        : [
            {
              slot: "Trailer 1",
              title: "GTA VI Trailer 1",
              link: "https://www.youtube.com/watch?v=QdBZY2fkU-0",
              thumbnail: "https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg"
            },
            {
              slot: "Trailer 2",
              title: "GTA VI Trailer 2",
              link: "https://www.youtube.com/watch?v=VQRLujxTm3c",
              thumbnail: "https://img.youtube.com/vi/VQRLujxTm3c/maxresdefault.jpg"
            },
            {
              slot: "Trailer 3",
              comingSoon: true
            }
          ]
    );

    startCountdown(data.releaseDate);

  } catch (err) {
    console.error("loadData error:", err);
  }
}

/* =========================
   COUNTDOWN
========================= */
function startCountdown(dateString) {
  const target = new Date(dateString).getTime();

  if (isNaN(target)) return;

  function update() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const d = document.getElementById("days");
    const h = document.getElementById("hours");
    const m = document.getElementById("minutes");
    const s = document.getElementById("seconds");

    if (d) d.innerText = days;
    if (h) h.innerText = hours;
    if (m) m.innerText = minutes;
    if (s) s.innerText = seconds;
  }

    update();
  setInterval(update, 1000);
}

/* =========================
   REGIONS
========================= */
function loadRegions(regions) {
  const box = document.getElementById("regions");
  if (!box) return;

  box.innerHTML = "";

  const flags = {
    US: "🇺🇸",
    Europe: "🇪🇺",
    Japan: "🇯🇵",
    Australia: "🇦🇺"
  };

  Object.entries(regions).forEach(([k, v]) => {
    const div = document.createElement("div");
    div.innerHTML = `${flags[k] || "🌍"} <strong>${k}</strong>: ${v}`;
    box.appendChild(div);
  });
}

/* =========================
   NEWSWIRE
========================= */
function loadNewswire(items) {
  const box = document.getElementById("newswire");
  if (!box) return;

  box.innerHTML = "";

  items.forEach(n => {
    const div = document.createElement("div");

    div.innerHTML = `
      <a href="${n.link}" target="_blank">${n.title}</a>
      <p>${n.summary || ""}</p>
    `;

    box.appendChild(div);
  });
}

/* =========================
   TRAILERS UI
========================= */
function loadGTAVITrailers(trailers) {
  const box = document.getElementById("latestVideo");
  if (!box) return;

  box.innerHTML = "";

  trailers.forEach(t => {
    const div = document.createElement("div");
    div.style.marginBottom = "18px";

    if (t.comingSoon) {
      div.innerHTML = `
        <div class="video-container" style="
          display:flex;
          align-items:center;
          justify-content:center;
          background:#111;
          color:#aaa;
          font-size:16px;">
          ${t.slot} — Coming soon
        </div>
      `;
    } else {
      div.innerHTML = `
        <div style="color:#4caf50;font-weight:bold;margin-bottom:6px">
          ${t.slot}
        </div>

        <a href="${t.link}" target="_blank">
          <img src="${t.thumbnail}" />
        </a>

        <div>
          <a href="${t.link}" target="_blank"
             style="color:white;text-decoration:none;font-weight:bold;">
            ${t.title}
          </a>
        </div>
      `;
    }

    box.appendChild(div);
  });
}

/* =========================
   NOTIFICATIONS
========================= */
function notifyUser(text) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(text);
  }
}

/* =========================
   INIT
========================= */
loadData();

/* INITIAL BADGES */
setBadge("liveBadge", "LIVE SYNC", "online");
setBadge("trailerBadge", "TRAILER WATCH", "monitoring");
setBadge("releaseBadge", "RELEASE TRACK", "pending");
