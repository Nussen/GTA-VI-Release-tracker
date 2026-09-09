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

const DEFAULT_TRAILERS = [
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
    title: "Grand Theft Auto VI: An Extended Look",
    link: "https://www.rockstargames.com/videos/rk721912",
    thumbnail: "https://www.rockstargames.com/VI/_next/static/media/GTAVI_An_Extended_Look_poster.0ijbsha5fo1te.jpg?akim=1&imdensity=1&imwidth=3840"
  }
];

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();

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

    if (psStatus) psStatus.innerText = getStoreStatus(data.playstation);
    if (xboxStatus) xboxStatus.innerText = getStoreStatus(data.xbox);

    /* =========================
       PREORDER COLORS (FIXED)
    ========================= */

    const psPreorder = document.getElementById("psPreorder");
    const xboxPreorder = document.getElementById("xboxPreorder");

    function applyPreorderStyle(el, value) {
      if (!el) return;

      const text = getPreorderText(value);
      const lower = text.toLowerCase();

      el.innerText = text;

      el.classList.remove("available", "unavailable");

      if (lower.includes("available") && !lower.includes("not available")) {
        el.classList.add("available");
      } else {
        el.classList.add("unavailable");
      }
    }

    applyPreorderStyle(psPreorder, data.psPreorder);
    applyPreorderStyle(xboxPreorder, data.xboxPreorder);

    /* =========================
       LOAD UI
    ========================= */
    loadRegions(data.regions || {});
    loadNewswire(data.newswire || []);

    const trailers = Array.isArray(data.gtaviTrailers) && data.gtaviTrailers.length
      ? data.gtaviTrailers
      : DEFAULT_TRAILERS;

    loadGTAVITrailers(trailers);
    setBadge(
      "trailerBadge",
      trailers.some(t => t.slot === "Trailer 3" && !t.comingSoon)
        ? "TRAILER 3 LIVE"
        : "TRAILER WATCH",
      trailers.some(t => t.slot === "Trailer 3" && !t.comingSoon)
        ? "online"
        : "monitoring"
    );

    startCountdown(data.releaseDate);

  } catch (err) {
    console.error("loadData error:", err);
  }
}

function getStoreStatus(store) {
  return typeof store === "object" ? store.status || "" : store || "";
}

function getPreorderText(value) {
  if (typeof value === "object") {
    return [value.status, value.price].filter(Boolean).join(" · ");
  }

  return value || "Not available";
}

/* =========================
   COUNTDOWN
========================= */
function startCountdown(dateString) {
  const target = new Date(dateString).getTime();

  if (isNaN(target)) {
    console.error("Invalid releaseDate:", dateString);
    return;
  }

  function update() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      document.getElementById("days").innerText = "0";
      document.getElementById("hours").innerText = "0";
      document.getElementById("minutes").innerText = "0";
      document.getElementById("seconds").innerText = "0";
      return;
    }

    document.getElementById("days").innerText = Math.floor(diff / 86400000);
    document.getElementById("hours").innerText = Math.floor((diff % 86400000) / 3600000);
    document.getElementById("minutes").innerText = Math.floor((diff % 3600000) / 60000);
    document.getElementById("seconds").innerText = Math.floor((diff % 60000) / 1000);
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

  Object.entries(regions).forEach(([key, value]) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <span style="margin-right:8px">${flags[key] || "🌍"}</span>
      <strong>${key}</strong>: ${value}
    `;
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

    const link = document.createElement("a");
    link.href = n.link || "https://www.rockstargames.com/newswire";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerText = n.title || "Rockstar Newswire";

    const summary = document.createElement("p");
    summary.innerText = n.summary || "";

    div.append(link, summary);

    box.appendChild(div);
  });
}

/* =========================
   TRAILERS
========================= */
function loadGTAVITrailers(trailers) {
  const box = document.getElementById("latestVideo");
  if (!box) return;

  box.innerHTML = "";

  trailers.forEach(t => {
    const div = document.createElement("div");
    div.style.marginBottom = "20px";

    if (t.comingSoon) {
      div.innerHTML = `
        <div class="video-container"
          style="display:flex;align-items:center;justify-content:center;
          background:#111;color:#aaa;font-size:18px;">
          ${t.slot} — Coming soon
        </div>
      `;
    } else {
      const slot = document.createElement("div");
      slot.innerText = t.slot || "Video";
      slot.style.cssText = "color:#4caf50;font-weight:bold;margin-bottom:8px";

      const link = document.createElement("a");
      link.href = t.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const image = document.createElement("img");
      image.src = t.thumbnail;
      image.alt = t.title || t.slot || "GTA VI video";
      image.style.cssText = "width:100%;border-radius:12px;margin-bottom:10px;cursor:pointer;box-shadow:0 0 20px rgba(0,0,0,0.4)";
      link.appendChild(image);

      const titleLink = document.createElement("a");
      titleLink.href = t.link;
      titleLink.target = "_blank";
      titleLink.rel = "noopener noreferrer";
      titleLink.innerText = t.title || t.slot || "GTA VI video";
      titleLink.style.cssText = "color:white;font-weight:bold;text-decoration:none";

      div.append(slot, link, titleLink);
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

setBadge("liveBadge", "LIVE SYNC", "online");
setBadge("trailerBadge", "TRAILER WATCH", "monitoring");
setBadge("releaseBadge", "RELEASE TRACK", "pending");
