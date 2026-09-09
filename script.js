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

    loadPriceMarkets(data);

    /* =========================
       LOAD UI
    ========================= */
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
  if (Number.isNaN(target)) return;

  function update() {
    const diff = target - Date.now();
    const values = diff <= 0
      ? [0, 0, 0, 0]
      : [
          Math.floor(diff / 86400000),
          Math.floor((diff % 86400000) / 3600000),
          Math.floor((diff % 3600000) / 60000),
          Math.floor((diff % 60000) / 1000)
        ];

    ["days", "hours", "minutes", "seconds"].forEach((id, index) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(values[index]);
    });
  }

  update();
  setInterval(update, 1000);
}

/* =========================
   NEWSWIRE
========================= */
function loadNewswire(items) {
  const box = document.getElementById("newswire");
  const toggle = document.getElementById("newsToggle");
  if (!box) return;

  const newsItems = Array.isArray(items) ? items : [];
  let expanded = false;

  function render() {
    box.replaceChildren();

    if (!newsItems.length) {
      const empty = document.createElement("p");
      empty.className = "news-empty";
      empty.textContent = "No Newswire updates found.";
      box.appendChild(empty);
    }

    newsItems.slice(0, expanded ? newsItems.length : 2).forEach(n => {
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

    if (toggle) {
      toggle.hidden = newsItems.length <= 2;
      toggle.textContent = expanded ? "Show fewer news items" : "View all news";
    }
  }

  if (toggle) {
    toggle.onclick = () => {
      expanded = !expanded;
      render();
    };
  }

  render();
}

/* =========================
   TRAILERS
========================= */
function loadGTAVITrailers(trailers) {
  const box = document.getElementById("latestVideo");
  const tabs = document.getElementById("trailerTabs");
  const activeTitle = document.getElementById("activeTrailerTitle");
  if (!box || !tabs) return;

  box.replaceChildren();
  tabs.replaceChildren();

  if (!trailers.length) {
    box.textContent = "No trailers available.";
    return;
  }

  const initialIndex = Math.max(0, trailers.findIndex(t => t.slot === "Trailer 3" && !t.comingSoon));

  function renderTrailer(index) {
    const trailer = trailers[index];
    box.replaceChildren();

    if (activeTitle) {
      activeTitle.textContent = `| ${trailer.title || trailer.slot || "Trailer"}`;
    }

    tabs.querySelectorAll("button").forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    const item = document.createElement("div");
    item.className = "trailer-item";

    if (trailer.comingSoon) {
      const placeholder = document.createElement("div");
      placeholder.className = "video-placeholder";
      placeholder.textContent = `${trailer.slot || "Trailer"} — Coming soon`;
      item.appendChild(placeholder);
    } else {
      const link = document.createElement("a");
      link.href = trailer.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const image = document.createElement("img");
      image.src = trailer.thumbnail;
      image.alt = trailer.title || trailer.slot || "GTA VI trailer";
      image.loading = "eager";
      image.decoding = "async";
      image.onerror = () => {
        image.hidden = true;
      };
      link.appendChild(image);
      item.appendChild(link);
    }

    box.appendChild(item);
  }

  trailers.forEach((trailer, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "trailer-tab";
    tab.role = "tab";
    tab.textContent = trailer.slot || `Trailer ${index + 1}`;
    tab.setAttribute("aria-controls", "latestVideo");
    tab.addEventListener("click", () => renderTrailer(index));
    tabs.appendChild(tab);
  });

  renderTrailer(initialIndex);
}
/* =========================
   INIT
========================= */
loadData();

setBadge("liveBadge", "AUTO-UPDATED", "online");
setBadge("trailerBadge", "TRAILER WATCH", "monitoring");
setBadge("releaseBadge", "RELEASE TRACK", "pending");
