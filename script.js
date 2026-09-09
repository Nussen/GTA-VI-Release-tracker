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
    const res = await fetch(`data.json?ts=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();

    const releaseStatus = document.getElementById("releaseStatus");
    const prediction = document.getElementById("prediction");

    if (releaseStatus) {
      releaseStatus.innerText = data.releaseStatus || "Loading...";
    }

    if (prediction) {
      prediction.textContent = data.prediction || "";
    }

    const lastUpdated = document.getElementById("lastUpdated");
    if (lastUpdated) {
      const updated = new Date(data.lastUpdated);
      lastUpdated.textContent = Number.isNaN(updated.getTime())
        ? "Last checked: unavailable"
        : `Last checked: ${updated.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
          })}`;
      lastUpdated.dateTime = updated.toISOString();
    }

    loadPriceMarkets(data);

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

    const releaseStatus = document.getElementById("releaseStatus");
    if (releaseStatus) releaseStatus.textContent = "Tracker data temporarily unavailable";

    const lastUpdated = document.getElementById("lastUpdated");
    if (lastUpdated) lastUpdated.textContent = "Refresh the page to try again";
  }
}

function getStoreStatus(store) {
  return typeof store === "object" ? store.status || "" : store || "";
}

function applyPreorderStyle(el, value) {
  if (!el) return;

  const text = getPreorderText(value);
  const status = typeof value === "object" ? value.status || "" : text;
  const lowerStatus = status.toLowerCase();

  el.textContent = text;
  el.classList.remove("available", "unavailable");

  if (lowerStatus.includes("available") && !lowerStatus.includes("not available")) {
    el.classList.add("available");
  } else {
    el.classList.add("unavailable");
  }
}

function getPreferredMarket(markets) {
  const locale = (navigator.language || "").toLowerCase();
  const region = locale.split("-")[1]?.toUpperCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (locale.startsWith("sv") || region === "SE" || timeZone === "Europe/Stockholm") {
    return markets.SEK ? "SEK" : "USD";
  }
  if (region === "AU" || timeZone.startsWith("Australia/")) {
    return markets.AUD ? "AUD" : "USD";
  }
  if (locale.startsWith("en-gb") || region === "GB") return markets.GBP ? "GBP" : "USD";

  const euroRegions = ["AT", "BE", "DE", "ES", "FI", "FR", "IE", "IT", "LU", "NL", "PT"];
  if (euroRegions.includes(region)) return markets.EUR ? "EUR" : "USD";

  return markets.USD ? "USD" : Object.keys(markets)[0];
}

function loadPriceMarkets(data) {
  const selector = document.getElementById("priceMarket");
  const psStatus = document.getElementById("psStatus");
  const xboxStatus = document.getElementById("xboxStatus");
  const psPreorder = document.getElementById("psPreorder");
  const xboxPreorder = document.getElementById("xboxPreorder");
  const psWishlist = document.getElementById("psWishlist");
  const xboxWishlist = document.getElementById("xboxWishlist");
  const markets = data.priceMarkets || {};

  if (!Object.keys(markets).length) {
    if (psStatus) psStatus.textContent = getStoreStatus(data.playstation);
    if (xboxStatus) xboxStatus.textContent = getStoreStatus(data.xbox);
    applyPreorderStyle(psPreorder, data.psPreorder);
    applyPreorderStyle(xboxPreorder, data.xboxPreorder);
    return;
  }

  if (selector) {
    selector.replaceChildren();
    Object.entries(markets).forEach(([key, market]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = market.label || key;
      selector.appendChild(option);
    });
  }

  let savedMarket = "";
  try {
    savedMarket = localStorage.getItem("gta-vi-price-market") || "";
  } catch {
    // Local storage may be unavailable for file:// previews.
  }

  const initialMarket = markets[savedMarket] ? savedMarket : getPreferredMarket(markets);
  if (selector) selector.value = initialMarket;

  function renderMarket() {
    const key = selector?.value || initialMarket;
    const market = markets[key] || markets[initialMarket];
    if (!market) return;

    if (psStatus) psStatus.textContent = getStoreStatus(market.playstation);
    if (xboxStatus) xboxStatus.textContent = getStoreStatus(market.xbox);
    applyPreorderStyle(psPreorder, market.psPreorder);
    applyPreorderStyle(xboxPreorder, market.xboxPreorder);

    if (psWishlist) psWishlist.href = market.playstation.url;
    if (xboxWishlist) xboxWishlist.href = market.xbox.url;
  }

  if (selector) {
    selector.onchange = () => {
      try {
        localStorage.setItem("gta-vi-price-market", selector.value);
      } catch {
        // Continue without persistence when storage is unavailable.
      }
      renderMarket();
    };
  }

  renderMarket();
}

function getPreorderText(value) {
  if (typeof value === "object") {
    const status = String(value.status || "").toLowerCase();

    if (status === "available") {
      return value.price || "Pre-order available";
    }

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
  box.replaceChildren();
  const codes = {
    US: "US",
    Europe: "EU",
    Japan: "JP",
    Australia: "AU"
  };

  const labels = {
    US: "United States",
    Europe: "Europe",
    Japan: "Japan",
    Australia: "Australia"
  };

  Object.entries(regions).forEach(([key, value]) => {
    const div = document.createElement("div");
    const code = document.createElement("span");
    code.className = "region-code";
    code.textContent = codes[key] || "--";

    const label = document.createElement("strong");
    label.textContent = labels[key] || key;

    div.append(code, label, document.createTextNode(`: ${value}`));
    box.appendChild(div);
  });
}

/* =========================
   NEWSWIRE
========================= */
function loadNewswire(items) {
  const box = document.getElementById("newswire");
  if (!box) return;

  box.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "news-empty";
    empty.textContent = "No Newswire updates found.";
    box.appendChild(empty);
    return;
  }

  items.forEach(n => {
    const div = document.createElement("div");

    const link = document.createElement("a");
    link.href = n.link || "https://www.rockstargames.com/newswire";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerText = n.title || "Rockstar Newswire";

    const summary = document.createElement("p");
    summary.innerText = n.summary || "";

    const readMore = document.createElement("a");
    readMore.className = "news-read-more";
    readMore.href = link.href;
    readMore.target = "_blank";
    readMore.rel = "noopener noreferrer";
    readMore.textContent = "Read article";

    const date = document.createElement("time");
    date.textContent = n.date || "";
    date.hidden = !n.date;

    div.append(link, date, summary, readMore);

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
      image.loading = "lazy";
      image.decoding = "async";
      image.onerror = () => {
        image.hidden = true;
      };
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
   INIT
========================= */
loadData();

setBadge("liveBadge", "AUTO-UPDATED", "online");
setBadge("trailerBadge", "TRAILER WATCH", "monitoring");
setBadge("releaseBadge", "RELEASE TRACK", "pending");
