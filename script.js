const CHANNEL_ID = "UC6VcWc1rAoWdBCM0JxrRQ3A";

/* =========================
   API CONFIG
========================= */

const API_URL = "/api/data";

/* =========================
   BADGE SYSTEM
========================= */

function setBadge(id, text, type) {

  const el = document.getElementById(id);

  if (!el) return;

  el.innerText = text;

  el.classList.remove(
    "online",
    "monitoring",
    "pending"
  );

  el.classList.add(type);
}

/* =========================
   ERROR UI
========================= */

function showError(message) {

  const releaseStatus =
    document.getElementById("releaseStatus");

  if (!releaseStatus) return;

  releaseStatus.innerText = message;
  releaseStatus.style.color = "#f44336";
}

/* =========================
   TRAILER 3 DISPLAY
========================= */

function showTrailer3(videoId) {

  loadGTAVITrailers([

    {
      slot: "Trailer 1",

      title:
        "Grand Theft Auto VI Trailer 1",

      link:
        "https://www.youtube.com/watch?v=QdBZY2fkU-0",

      thumbnail:
        "https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg"
    },

    {
      slot: "Trailer 2",

      title:
        "Grand Theft Auto VI Trailer 2",

      link:
        "https://www.youtube.com/watch?v=VQRLujxTm3c",

      thumbnail:
        "https://img.youtube.com/vi/VQRLujxTm3c/maxresdefault.jpg"
    },

    {
      slot: "Trailer 3",

      title:
        "Grand Theft Auto VI Trailer 3",

      link:
        `https://www.youtube.com/watch?v=${videoId}`,

      thumbnail:
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

  ]);
}

/* =========================
   TRAILER CHECK
========================= */

async function checkForNewTrailers() {

  try {

    const res =
      await fetch("/api/youtube");

    if (!res.ok) {
      throw new Error("YouTube API failed");
    }

    const data = await res.json();

    setBadge(
      "trailerBadge",
      "TRAILER WATCH",
      "monitoring"
    );

    const known = [
      "QdBZY2fkU-0",
      "VQRLujxTm3c"
    ];

    const videos = data.items || [];

    const newVideo =
      videos.find(v =>
        v.id?.videoId &&
        !known.includes(v.id.videoId)
      );

    if (newVideo?.id?.videoId) {

      showTrailer3(
        newVideo.id.videoId
      );

      setBadge(
        "trailerBadge",
        "TRAILER 3 DROPPED",
        "online"
      );

      notifyUser(
        "🚨 Trailer 3 just dropped!"
      );
    }

  } catch (err) {

    console.error(
      "Trailer check failed:",
      err
    );

    setBadge(
      "trailerBadge",
      "OFFLINE",
      "pending"
    );
  }
}

/* =========================
   LOAD DATA
========================= */

async function loadData() {

  try {

    const res =
      await fetch(API_URL);

    if (!res.ok) {
      throw new Error(
        "Failed to load API data"
      );
    }

    const data =
      await res.json();

    /* =========================
       RELEASE STATUS
    ========================= */

    const releaseStatus =
      document.getElementById(
        "releaseStatus"
      );

    const prediction =
      document.getElementById(
        "prediction"
      );

    if (releaseStatus) {

      releaseStatus.innerText =
        data.releaseStatus ||
        "Loading...";
    }

    if (prediction) {

      prediction.innerText =
        data.prediction || "";
    }

    /* =========================
       STORE STATUS
    ========================= */

    const psStatus =
      document.getElementById(
        "psStatus"
      );

    const xboxStatus =
      document.getElementById(
        "xboxStatus"
      );

    if (psStatus) {

      psStatus.innerText =
        data.playstation || "";
    }

    if (xboxStatus) {

      xboxStatus.innerText =
        data.xbox || "";
    }

    /* =========================
       PREORDER COLORS
    ========================= */

    applyPreorderStyle(
      document.getElementById(
        "psPreorder"
      ),
      data.psPreorder
    );

    applyPreorderStyle(
      document.getElementById(
        "xboxPreorder"
      ),
      data.xboxPreorder
    );

    /* =========================
       LOAD UI SECTIONS
    ========================= */

    loadRegions(
      data.regions || {}
    );

    loadNewswire(
      data.newswire || []
    );

    loadGTAVITrailers(
      Array.isArray(
        data.gtaviTrailers
      ) &&
      data.gtaviTrailers.length
        ? data.gtaviTrailers
        : fallbackTrailers()
    );

    /* =========================
       COUNTDOWN
    ========================= */

    if (data.releaseDate) {

      startCountdown(
        data.releaseDate
      );
    }

    /* =========================
       LAST UPDATED
    ========================= */

    console.log(
      "Last updated:",
      data.lastUpdated
    );

  } catch (err) {

    console.error(
      "loadData error:",
      err
    );

    showError(
      "⚠ Unable to load GTA VI tracker"
    );
  }
}

/* =========================
   PREORDER STYLE ENGINE
========================= */

function applyPreorderStyle(
  element,
  value
) {

  if (!element) return;

  const text =
    value || "";

  const lower =
    text.toLowerCase();

  element.innerText =
    text;

  element.classList.remove(
    "available",
    "unavailable"
  );

  if (
    lower.includes("available") &&
    !lower.includes("not")
  ) {

    element.classList.add(
      "available"
    );

  } else {

    element.classList.add(
      "unavailable"
    );
  }
}

/* =========================
   COUNTDOWN
========================= */

let countdownInterval;

function startCountdown(
  dateString
) {

  const target =
    new Date(dateString)
      .getTime();

  if (isNaN(target)) {

    console.error(
      "Invalid release date:",
      dateString
    );

    return;
  }

  clearInterval(
    countdownInterval
  );

  function update() {

    const now = Date.now();

    const diff =
      target - now;

    if (diff <= 0) {

      setCountdown(
        0,
        0,
        0,
        0
      );

      return;
    }

    const days =
      Math.floor(
        diff / 86400000
      );

    const hours =
      Math.floor(
        (diff % 86400000)
        / 3600000
      );

    const minutes =
      Math.floor(
        (diff % 3600000)
        / 60000
      );

    const seconds =
      Math.floor(
        (diff % 60000)
        / 1000
      );

    setCountdown(
      days,
      hours,
      minutes,
      seconds
    );
  }

  update();

  countdownInterval =
    setInterval(
      update,
      1000
    );
}

/* =========================
   SET COUNTDOWN
========================= */

function setCountdown(
  days,
  hours,
  minutes,
  seconds
) {

  document.getElementById(
    "days"
  ).innerText = days;

  document.getElementById(
    "hours"
  ).innerText = hours;

  document.getElementById(
    "minutes"
  ).innerText = minutes;

  document.getElementById(
    "seconds"
  ).innerText = seconds;
}

/* =========================
   REGIONS
========================= */

function loadRegions(
  regions
) {

  const box =
    document.getElementById(
      "regions"
    );

  if (!box) return;

  box.innerHTML = "";

  const flags = {

    US: "🇺🇸",

    Europe: "🇪🇺",

    Japan: "🇯🇵",

    Australia: "🇦🇺"
  };

  Object.entries(
    regions
  ).forEach(([key, value]) => {

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "region-row";

    div.innerHTML = `

      <span class="region-flag">
        ${flags[key] || "🌍"}
      </span>

      <strong>${key}</strong>

      <span class="region-status">
        ${value}
      </span>
    `;

    box.appendChild(div);
  });
}

/* =========================
   NEWSWIRE
========================= */

/* =========================
   NEWSWIRE
========================= */
function loadNewswire(items) {

  const box = document.getElementById("newswire");

  if (!box) return;

  box.innerHTML = "";

  if (!items.length) {

    box.innerHTML = `
      <div class="news-empty">
        No Rockstar Newswire posts available.
      </div>
    `;

    return;
  }

  items.forEach(n => {

    const div = document.createElement("div");

    div.className = "news-item";

    div.innerHTML = `

      ${
        n.image
          ? `
            <a href="${n.link}" target="_blank">
              <img
                src="${n.image}"
                alt="${n.title}"
                class="news-thumb"
              />
            </a>
          `
          : ""
      }

      <div class="news-content">

        <a
          href="${n.link}"
          target="_blank"
          class="news-title"
        >
          ${n.title}
        </a>

        <p class="news-summary">
          ${n.summary || ""}
        </p>

      </div>
    `;

    box.appendChild(div);
  });
}

/* =========================
   TRAILERS
========================= */

function loadGTAVITrailers(
  trailers
) {

  const box =
    document.getElementById(
      "latestVideo"
    );

  if (!box) return;

  box.innerHTML = "";

  trailers.forEach(t => {

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "trailer-card";

    if (t.comingSoon) {

      div.innerHTML = `

        <div class="video-container trailer-coming">

          ${t.slot}
          — Coming Soon

        </div>
      `;

    } else {

      div.innerHTML = `

        <div class="trailer-slot">
          ${t.slot}
        </div>

        <a
          href="${t.link}"
          target="_blank"
        >

          <img
            src="${t.thumbnail}"
            alt="${t.title}"
            class="trailer-image"
          />

        </a>

        <div>

          <a
            href="${t.link}"
            target="_blank"
            class="trailer-title"
          >

            ${t.title}

          </a>

        </div>
      `;
    }

    box.appendChild(div);
  });
}

/* =========================
   FALLBACK TRAILERS
========================= */

function fallbackTrailers() {

  return [

    {
      slot: "Trailer 1",

      title:
        "Grand Theft Auto VI Trailer 1",

      link:
        "https://www.youtube.com/watch?v=QdBZY2fkU-0",

      thumbnail:
        "https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg"
    },

    {
      slot: "Trailer 2",

      title:
        "Grand Theft Auto VI Trailer 2",

      link:
        "https://www.youtube.com/watch?v=VQRLujxTm3c",

      thumbnail:
        "https://img.youtube.com/vi/VQRLujxTm3c/maxresdefault.jpg"
    },

    {
      slot: "Trailer 3",
      comingSoon: true
    }
  ];
}

/* =========================
   NOTIFICATIONS
========================= */
function notifyUser(
  text
) {

  if (
    !("Notification" in window)
  ) return;

  if (
    Notification.permission ===
    "granted"
  ) {

    new Notification(text);
  }
}

/* =========================
   INIT
========================= */

loadData();

/* Optional real-time loop */
/*
setInterval(() => {
  loadData();
  checkForNewTrailers();
}, 60000);
*/

setBadge(
  "liveBadge",
  "LIVE SYNC",
  "online"
);

setBadge(
  "trailerBadge",
  "TRAILER WATCH",
  "monitoring"
);

setBadge(
  "releaseBadge",
  "RELEASE TRACK",
  "pending"
);
