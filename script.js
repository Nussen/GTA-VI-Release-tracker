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
   TRAILER 3 DETECTION
========================= */
async function checkForNewTrailers() {

  try {

    const res = await fetch("/api/youtube");

    if (!res.ok) throw new Error("YouTube API failed");

    const data = await res.json();

    setBadge("trailerBadge", "TRAILER WATCH", "monitoring");

    const known = [
      "QdBZY2fkU-0",
      "VQRLujxTm3c"
    ];

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

/* =========================
   REAL-TIME LOOP
========================= */
setInterval(checkForNewTrailers, 60000);

/* =========================
   LOAD DATA
========================= */
async function loadData() {

  try {

    const res = await fetch("data.json");
    const data = await res.json();

    document.getElementById("releaseStatus").innerText =
      data.releaseStatus || "Loading...";

    document.getElementById("prediction").innerText =
      data.prediction || "";

    document.getElementById("psStatus").innerText =
      data.playstation || "";

    document.getElementById("xboxStatus").innerText =
      data.xbox || "";

    document.getElementById("psPreorder").innerText =
      data.psPreorder || "";

    document.getElementById("xboxPreorder").innerText =
      data.xboxPreorder || "";

    loadRegions(data.regions || {});
    loadNewswire(data.newswire || []);

    /* SAFE TRAILER FALLBACK (IMPORTANT FIX) */
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
   COUNTDOWN (FIXED)
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

    document.getElementById("days").innerText =
      Math.floor(diff / 86400000);

    document.getElementById("hours").innerText =
      Math.floor((diff % 86400000) / 3600000);

    document.getElementById("minutes").innerText =
      Math.floor((diff % 3600000) / 60000);

    document.getElementById("seconds").innerText =
      Math.floor((diff % 60000) / 1000);
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

  Object.entries(regions).forEach(([k, v]) => {

    const div = document.createElement("div");
    div.innerHTML = `<strong>${k}</strong>: ${v}`;
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

      div.innerHTML = `
        <div style="color:#4caf50;font-weight:bold;margin-bottom:8px">
          ${t.slot}
        </div>

        <a href="${t.link}" target="_blank">
          <img
            src="${t.thumbnail}"
            style="
              width:100%;
              border-radius:12px;
              margin-bottom:10px;
              cursor:pointer;
              box-shadow:0 0 20px rgba(0,0,0,0.4);
            "
          />
        </a>

        <div>
          <a href="${t.link}" target="_blank"
            style="color:white;font-weight:bold;text-decoration:none">
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

/* initial badge states */
setBadge("liveBadge", "LIVE SYNC", "online");
setBadge("trailerBadge", "TRAILER WATCH", "monitoring");
setBadge("releaseBadge", "RELEASE TRACK", "pending");