import fs from "fs";

const STORE_MARKETS = {
  USD: {
    label: "United States (USD)",
    fallbackPrice: "$79.99 Standard / $99.99 Ultimate",
    playstation: "https://store.playstation.com/en-us/product/EP1004-PPSA01547_00-GTAVISTANDARD001",
    xbox: "https://www.xbox.com/en-us/games/store/grand-theft-auto-vi/9p3h4968grsm"
  },
  EUR: {
    label: "Euro area (EUR)",
    fallbackPrice: "€79.99 Standard / €99.99 Ultimate",
    playstation: "https://store.playstation.com/de-de/product/EP1004-PPSA01547_00-GTAVISTANDARD001",
    xbox: "https://www.xbox.com/de-de/games/store/grand-theft-auto-vi/9p3h4968grsm"
  },
  SEK: {
    label: "Sweden (SEK)",
    fallbackPrice: "899 kr Standard / 1,149 kr Ultimate",
    playstation: "https://store.playstation.com/sv-se/concept/10000730",
    xbox: "https://www.xbox.com/sv-se/games/store/grand-theft-auto-vi/9nl3wwnzlzzn"
  },
  GBP: {
    label: "United Kingdom (GBP)",
    fallbackPrice: "£69.99 Standard / £89.99 Ultimate",
    playstation: "https://store.playstation.com/en-gb/product/EP1004-PPSA01547_00-GTAVISTANDARD001",
    xbox: "https://www.xbox.com/en-gb/games/store/grand-theft-auto-vi/9p3h4968grsm"
  },
  AUD: {
    label: "Australia (AUD)",
    fallbackPrice: "AU$129.95 Standard / AU$159.95 Ultimate",
    playstation: "https://store.playstation.com/en-au/product/EP1004-PPSA38500_00-GTAVISTANDARD001",
    xbox: "https://www.xbox.com/en-au/games/store/grand-theft-auto-vi/9nl3wwnzlzzn"
  }
};

/* =========================
   SAFE FETCH WRAPPER
========================= */
async function safeFetch(url, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GTA-VI-Tracker/1.0"
        },
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.text();
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error(`Fetch failed after ${maxAttempts} attempts:`, url, err.message);
      }
    } finally {
      clearTimeout(timeout);
    }

    await new Promise(resolve => setTimeout(resolve, 750 * attempt));
  }

  return "";
}

/* =========================
   LOCALIZED STORE CHECK
========================= */
function extractEditionPrices(html, currency) {
  const amountByCurrency = {
    USD: String.raw`\d{1,3}(?:,\d{3})*(?:\.\d{2})?`,
    GBP: String.raw`\d{1,3}(?:,\d{3})*(?:\.\d{2})?`,
    AUD: String.raw`\d{1,3}(?:,\d{3})*(?:\.\d{2})?`,
    EUR: String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?`,
    SEK: String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?`
  };
  const amount = amountByCurrency[currency] || amountByCurrency.USD;
  const symbol = currency === "USD"
    ? "\\$"
    : currency === "AUD"
      ? "(?:AU\\$|A\\$|\\$)"
      : currency === "GBP"
        ? "£"
        : "€";
  const suffix = currency === "SEK" ? "kr" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  const pattern = suffix
    ? new RegExp(`(?:${symbol}\\s?${amount}|${amount}\\s?${suffix})`, "gi")
    : new RegExp(`${symbol}\\s?${amount}`, "gi");
  const matches = stripMarkup(html).match(pattern) || [];
  const prices = [];

  for (const match of matches) {
    const price = match.replace(/\s+/g, " ").replace(/\+$/, "").trim();
    if (!prices.includes(price)) prices.push(price);
  }

  const numericValue = price => {
    const number = price.replace(/[^0-9.,]/g, "");

    if (number.includes(",") && number.includes(".")) {
      return number.lastIndexOf(",") > number.lastIndexOf(".")
        ? Number.parseFloat(number.replace(/\./g, "").replace(",", "."))
        : Number.parseFloat(number.replace(/,/g, ""));
    }

    if (number.includes(",")) {
      return /,\d{2}$/.test(number)
        ? Number.parseFloat(number.replace(",", "."))
        : Number.parseFloat(number.replace(/,/g, ""));
    }

    return Number.parseFloat(number);
  };

  const minimum = currency === "SEK" ? 500 : 30;
  return prices
    .filter(price => numericValue(price) > minimum)
    .sort((a, b) => numericValue(a) - numericValue(b))
    .slice(0, 2);
}

function parsePriceValue(price) {
  const number = price.replace(/[^0-9.,]/g, "");

  if (number.includes(",") && number.includes(".")) {
    return number.lastIndexOf(",") > number.lastIndexOf(".")
      ? Number.parseFloat(number.replace(/\./g, "").replace(",", "."))
      : Number.parseFloat(number.replace(/,/g, ""));
  }

  if (/,\d{2}$/.test(number)) return Number.parseFloat(number.replace(",", "."));
  if (/\.\d{2}$/.test(number)) return Number.parseFloat(number);
  return Number.parseFloat(number.replace(/[.,]/g, ""));
}

function formatMarketPrice(prices, currency) {
  const values = prices.map(parsePriceValue);
  const format = (value, locale, options) => new Intl.NumberFormat(locale, options).format(value);

  const formatted = values.map(value => {
    if (currency === "SEK") return `${format(value, "sv-SE", { maximumFractionDigits: 0 })} kr`;
    if (currency === "EUR") return `${format(value, "de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    if (currency === "AUD") return `AU$${format(value, "en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (currency === "GBP") return `£${format(value, "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${format(value, "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  return `${formatted[0]} Standard / ${formatted[1]} Ultimate`;
}

function hasPreorderText(html) {
  return /pre[- ]?order|preorder|vorbestell|förbeställ|reserv|précommand/i.test(html);
}

async function getStoreDetails(url, fallbackPrice, currency) {
  const html = await safeFetch(url);

  if (!html) {
    return { available: false, price: fallbackPrice };
  }

  const prices = extractEditionPrices(html, currency);

  return {
    available: hasPreorderText(html),
    price: prices.length === 2
      ? formatMarketPrice(prices, currency)
      : fallbackPrice
  };
}
/* =========================
   NEWSWIRE (OFFICIAL LIVE LIST)
========================= */
function stripMarkup(value = "") {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function getMetaContent(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escapedKey}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapedKey}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return stripMarkup(match[1]);
  }

  return "";
}

function parseNewswireCards(html) {
  const cards = [];
  const pattern = /<a\s+href=["'](https:\/\/www\.rockstargames\.com\/newswire\/article\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const block = match[2];
    const titleMatch = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    const dateMatch = block.match(/<p[^>]*>([^<]+)<\/p>/i);
    const title = stripMarkup(titleMatch?.[1] || "");
    const date = stripMarkup(dateMatch?.[1] || "");

    if (!title) continue;

    cards.push({
      title,
      link: match[1],
      date,
      sortDate: Date.parse(date.replace(/(\d+)(st|nd|rd|th)/i, "$1")) || 0
    });
  }

  const unique = new Map(cards.map(card => [card.link, card]));
  return [...unique.values()].sort((a, b) => b.sortDate - a.sortDate);
}

async function getNews() {
  const html = await safeFetch("https://www.rockstargames.com/VI");
  const cards = parseNewswireCards(html);

  if (!cards.length) return fallbackNewswire();

  return Promise.all(cards.slice(0, 8).map(async card => {
    const articleHtml = await safeFetch(card.link);
    const summary = getMetaContent(articleHtml, "og:description")
      || getMetaContent(articleHtml, "description")
      || "Official Rockstar Games Newswire update.";

    return {
      title: card.title,
      link: card.link,
      date: card.date,
      summary
    };
  }));
}
/* =========================
   FALLBACK NEWSWIRE
========================= */
function fallbackNewswire() {
  try {
    const existing = JSON.parse(fs.readFileSync("data.json", "utf8"));
    if (Array.isArray(existing.newswire) && existing.newswire.length) {
      return existing.newswire;
    }
  } catch {
    // Use the built-in list when no previous data exists.
  }

  return [
    {
      title: "Grand Theft Auto VI: An Extended Look — Now Playing",
      link: "https://www.rockstargames.com/newswire/article/4k138k8okkk483",
      date: "August 27th, 2026",
      summary: "The official GTA VI Extended Look is now available."
    },
    {
      title: "Pre-Order Grand Theft Auto VI on June 25",
      link: "https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25",
      date: "June 24, 2026",
      summary: "Pre-orders are available on PlayStation 5 and Xbox Series X|S."
    },
    {
      title: "Grand Theft Auto VI is Now Set to Launch November 19, 2026",
      link: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026",
      date: "November 6, 2025",
      summary: "Rockstar confirmed the official release date for Grand Theft Auto VI."
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

  const marketResults = await Promise.all(
    Object.entries(STORE_MARKETS).map(async ([currency, market]) => {
      const [playstation, xbox] = await Promise.all([
        getStoreDetails(market.playstation, market.fallbackPrice, currency),
        getStoreDetails(market.xbox, market.fallbackPrice, currency)
      ]);

      return [currency, {
        label: market.label,
        currency,
        playstation: {
          status: playstation.available ? "Pre-order available" : "Not listed",
          url: market.playstation
        },
        xbox: {
          status: xbox.available ? "Pre-order available" : "Not listed",
          url: market.xbox
        },
        psPreorder: playstation.available
          ? { status: "Available", price: playstation.price }
          : { status: "Not available" },
        xboxPreorder: xbox.available
          ? { status: "Available", price: xbox.price }
          : { status: "Not available" }
      }];
    })
  );

  const priceMarkets = Object.fromEntries(marketResults);
  const primary = priceMarkets.USD;
  const australia = priceMarkets.AUD;
  const ps = primary.playstation.status === "Pre-order available";
  const xbox = primary.xbox.status === "Pre-order available";
  const australiaAvailable = australia.playstation.status === "Pre-order available"
    || australia.xbox.status === "Pre-order available";

  const newswire = await getNews();

  const gtaviTrailers = getFixedTrailers();

  const data = {

    lastUpdated: new Date().toISOString(),

    releaseStatus: ps || xbox
      ? "🔥 PREORDERS AVAILABLE"
      : "Monitoring Stores",

    prediction: "Official release date: November 19, 2026",

    releaseDate: "2026-11-19T00:00:00",

    playstation: {
      status: ps ? "Pre-order available" : "Not listed",
      url: primary.playstation.url
    },
    xbox: {
      status: xbox ? "Pre-order available" : "Not listed",
      url: primary.xbox.url
    },

    psPreorder: primary.psPreorder,
    xboxPreorder: primary.xboxPreorder,

    priceMarkets,

    regions: {
      US: ps || xbox ? "LIVE" : "Pending",
      Europe: ps || xbox ? "LIVE" : "Pending",
      Japan: ps ? "LIVE" : "Pending",
      Australia: australiaAvailable ? "LIVE" : "Not checked"
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
