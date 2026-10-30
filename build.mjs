// Builds the static site into ./_site from data/*.json, assets/ and images/.
// Usage: npm run build
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "_site");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const trips = JSON.parse(fs.readFileSync(path.join(ROOT, "data/trips.json"), "utf8"));
const BASE = new URL(site.url);                 // e.g. https://shivam2rana.github.io/nomad-shibhu/
const BASE_PATH = BASE.pathname.endsWith("/") ? BASE.pathname : BASE.pathname + "/";
const TAGS = ["Panch Kedar", "Char Dham", "Treks", "Valleys"];
const PK = [
  { n: 1, id: "kedarnath", name: "Kedarnath", part: "hump", alt: 3583 },
  { n: 2, id: "tungnath", name: "Tungnath", part: "arms", alt: 3680 },
  { n: 3, id: "rudranath", name: "Rudranath", part: "face", alt: 3600 },
  { n: 4, id: "madhyamaheshwar", name: "Madhyamaheshwar", part: "navel", alt: 3497 },
  { n: 5, id: "kalpeshwar", name: "Kalpeshwar", part: "hair", alt: 2200 },
];

/* ---------- validation: fail the build on bad data instead of shipping it ---------- */
const ids = new Set();
for (const t of trips) {
  if (!/^[a-z0-9-]{2,60}$/.test(t.id || "")) throw new Error(`Trip id must be lowercase letters, digits and dashes: ${t.id}`);
  if (ids.has(t.id)) throw new Error(`Duplicate trip id: ${t.id}`);
  ids.add(t.id);
  if (!t.title) throw new Error(`Trip ${t.id} needs a title`);
  for (const m of t.media || []) {
    if (!/^images\/[\w./-]+$/.test(m.src || "") || m.src.includes("..")) throw new Error(`Media path must be inside images/: ${m.src}`);
    if (!fs.existsSync(path.join(ROOT, m.src))) throw new Error(`Missing file: ${m.src}`);
  }
  if (t.cover && !fs.existsSync(path.join(ROOT, t.cover))) throw new Error(`Missing cover: ${t.cover}`);
  if (t.reel && !/^https:\/\/(www\.)?instagram\.com\//.test(t.reel)) throw new Error(`Reel link must be an instagram.com URL: ${t.reel}`);
}

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtAlt = (m) => (m ? Number(m).toLocaleString("en-IN") + " m" : "–");
const ext = 'target="_blank" rel="noopener noreferrer"';
const I = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  peak: '<path d="M3 20l6-10 4 6 3-4 5 8z"/><path d="M8 12l1.5 1.5L11 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',
  steps: '<path d="M7 4c1.7 0 2.5 1.6 2.5 3.5S8.5 12 7 12 4.5 10 4.5 8 5.3 4 7 4z"/><path d="M5 14.5h4"/><path d="M17 9c1.7 0 2.5 1.6 2.5 3.5S18.5 17 17 17s-2.5-2-2.5-4 .8-4 2.5-4z"/><path d="M15 19.5h4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  rail: '<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 20l-1.5 1.5M15 20l1.5 1.5M9 13h.01M15 13h.01"/>',
  plane: '<path d="M2.5 13.5l19-6.5-6.5 13-2.5-6z"/><path d="M12.5 14l9-7"/>',
  bus: '<rect x="4" y="3.5" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-3.5M16 21v-3.5M8 14.5h.01M16 14.5h.01"/>',
  chat: '<path d="M4 19.5l1.3-3.8A8 8 0 1 1 8.6 19z"/><path d="M9 10.5h6M9 13.5h4"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ---------- generated mountain art for trips without photos ---------- */
const PALETTES = {
  dawn: { sky: ["#5f8fbd", "#f2c3a1"], sun: "#ffe3bd", ridges: ["#c9d5e4", "#93a7c0", "#5d728f", "#2c3d55"] },
  day: { sky: ["#2f86bf", "#cfe8f4"], sun: "#fffbe8", ridges: ["#eef5fa", "#93b5cb", "#5a7f98", "#2a475b"] },
  mist: { sky: ["#8ea6ad", "#e3eae8"], sun: "#ffffff", ridges: ["#d2ddda", "#9cb1ab", "#62807a", "#33504a"] },
  dusk: { sky: ["#26305e", "#ec8e69"], sun: "#ffd2a6", ridges: ["#b07a8c", "#71537a", "#41385c", "#1b1b37"] },
};
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mountainSvg(key, style, w, h) {
  const P = PALETTES[style] || PALETTES.day, r = rng(hash(key));
  const sx = w * (0.2 + r() * 0.6), sy = h * (0.22 + r() * 0.12), sr = Math.min(w, h) * 0.07;
  let paths = "", snow = "";
  for (let L = 0; L < 4; L++) {
    const base = h * (0.42 + L * 0.15), amp = h * (0.26 - L * 0.05);
    const ph = [r() * 6, r() * 6, r() * 6], fq = [1.3 + r(), 2.7 + r() * 2, 6 + r() * 5], peakX = w * (0.15 + r() * 0.7);
    const pts = [];
    for (let x = 0; x <= w + 0.1; x += w / 90) {
      const u = x / w;
      let y = base - amp * 0.45 * (Math.sin(u * fq[0] * Math.PI + ph[0]) * 0.5 + 0.5)
        - amp * 0.25 * (Math.sin(u * fq[1] * Math.PI + ph[1]) * 0.5 + 0.5)
        - amp * 0.1 * Math.abs(Math.sin(u * fq[2] * Math.PI + ph[2]));
      if (L === 0) y -= amp * 0.55 * Math.max(0, 1 - Math.abs(x - peakX) / (w * 0.22));
      pts.push([x, y]);
    }
    const d = `M0 ${h} ` + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + ` L${w} ${h} Z`;
    paths += `<path d="${d}" fill="${P.ridges[L]}"/>`;
    if (L === 0) {
      const snowLine = Math.min(...pts.map((p) => p[1])) + amp * 0.32;
      snow = `<clipPath id="r0"><path d="${d}"/></clipPath><rect x="0" y="0" width="${w}" height="${snowLine.toFixed(1)}" fill="#ffffff" fill-opacity=".85" clip-path="url(#r0)"/>`;
      paths += "SNOW";
    }
  }
  paths = paths.replace("SNOW", snow);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".75" stop-color="${P.sky[1]}"/></linearGradient>
<radialGradient id="glow" cx="${sx}" cy="${sy}" r="${sr * 5}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${P.sun}"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/><rect width="${w}" height="${h}" fill="url(#glow)"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${P.sun}"/>${paths}</svg>`;
}
const artBuffer = (key, style, w, h) => sharp(Buffer.from(mountainSvg(key, style, w, h))).png().toBuffer();

/* ---------- responsive images: WebP in two or three sizes + one JPEG fallback ---------- */
// Photos are auto-rotated, resized and stripped of all metadata (including GPS location).
const V = new Map();
async function makeVariants(input, key, widths) {
  const buf = await sharp(input).rotate().toBuffer();
  const meta = await sharp(buf).metadata();
  let use = widths.filter((w) => w <= meta.width);
  if (!use.length) use = [meta.width];
  const dir = path.join(OUT, "images/r");
  fs.mkdirSync(dir, { recursive: true });
  const webp = [];
  for (const w of use) {
    const f = `images/r/${key}-${w}.webp`;
    await sharp(buf).resize({ width: w }).webp({ quality: 78 }).toFile(path.join(OUT, f));
    webp.push([f, w]);
  }
  const big = use[use.length - 1];
  const jpg = `images/r/${key}-${big}.jpg`;
  await sharp(buf).resize({ width: big }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, jpg));
  return { webp, jpg, w: big, h: Math.round((meta.height * big) / meta.width) };
}
function pic(v, { alt = "", sizes = "100vw", cls = "", eager = false, pre = "" }) {
  return `<picture><source type="image/webp" srcset="${v.webp.map(([f, w]) => `${pre}${f} ${w}w`).join(", ")}" sizes="${sizes}">` +
    `<img src="${pre}${v.jpg}" alt="${esc(alt)}" width="${v.w}" height="${v.h}"${cls ? ` class="${cls}"` : ""} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const CARD_SIZES = "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px";

/* ---------- page parts ---------- */
const coverV = (t) => V.get(t.cover) || V.get((t.media || []).find((m) => m.kind === "image")?.src) || V.get(`gen:${t.id}`);
const abs = (rel) => new URL(rel, BASE).href;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASON = { b: ["s-b", "Best time"], o: ["s-o", "Open, but rain, snow or part of the month only"], x: ["s-x", "Closed or not advised"] };
const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>\n`;
const seasonLegend = `<ul class="legend"><li><span class="sw s-b"></span>Best</li><li><span class="sw s-o"></span>Open, with rain, snow or part-month</li><li><span class="sw s-x"></span>Closed or not advised</li></ul>`;
function monthStrip(t) {
  const m = t.months || "";
  if (m.length !== 12) return "";
  return `<ol class="strip" aria-label="Season by month">${MONTHS.map((n, i) => `<li class="${SEASON[m[i]][0]}" title="${n}: ${SEASON[m[i]][1]}"><span aria-hidden="true">${n[0]}</span><span class="sr">${n}: ${SEASON[m[i]][1]}</span></li>`).join("")}</ol>`;
}
const CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:", "font-src 'self'",
  "media-src 'self'", "connect-src 'self'", "manifest-src 'self'", "base-uri 'self'", "form-action 'none'", "upgrade-insecure-requests",
].join("; ");

function head({ title, description, canonical, image, pre, extra = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#0c2a40">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${pre}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${pre}assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${pre}assets/css/site.css">
<script src="${pre}assets/js/site.js" defer></script>
${extra}</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}
function header(pre, home) {
  const h = home ? "" : `${pre}index.html`;
  return `<header class="top"><div class="wrap">
<a class="mark" href="${pre}index.html" aria-label="${esc(site.title)} home"><span>Nomad</span><b>Shibhu</b></a>
<nav class="nav" aria-label="Main"><a href="${h}#trips">Trips</a><a href="${h}#when-to-go">When to go</a><a href="${h}#getting-there">Getting there</a><a href="${h}#panch-kedar">Panch Kedar</a><a href="${h}#about">About</a><a href="${h}#faq">FAQ</a></nav>
<div class="top-actions"><a class="btn btn-primary" href="${esc(site.instagram)}" ${ext} aria-label="Follow @${esc(site.handle)} on Instagram">${ico("ig")}Follow</a></div>
</div></header>`;
}
function footer() {
  return `<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(site.name)} · @${esc(site.handle)}</span><span>Itineraries are approximate. Check road and weather updates before you travel.</span></div></footer>
</body>
</html>
`;
}
function card(t, pre) {
  const text = [t.title, t.route, t.region, (t.tags || []).join(" "), t.summary].join(" ").toLowerCase();
  const season = (t.season || "").split(" (")[0];
  return `<a class="card" href="${pre}trips/${t.id}/" data-tags="${esc((t.tags || []).join("|"))}" data-text="${esc(text)}">
<div class="card-media">${pic(coverV(t), { alt: t.title, sizes: CARD_SIZES, pre })}<span class="tag">${esc((t.tags || [])[0] || "Trip")}</span><span class="tag r">${esc(t.days)} ${t.days == 1 ? "day" : "days"}</span></div>
<div class="card-body">
<div class="route">${ico("pin")}${esc(t.route)}</div>
<h3>${esc(t.title)}</h3>
<p class="sum">${esc(t.summary)}</p>
<div class="facts">
<div class="fact">${ico("peak")}<b>${esc(fmtAlt(t.altitude))}</b>Altitude</div>
<div class="fact">${ico("steps")}<b>${esc(t.trek)}</b>Trail</div>
<div class="fact">${ico("gauge")}<b>${esc((t.difficulty || "").split("–")[0])}</b>Grade</div>
<div class="fact">${ico("clock")}<b>${esc(t.days)}D</b>Plan</div>
</div>
<div class="card-foot"><span>${ico("pin")}From ${esc(t.start || "Rishikesh")} · ${esc(season)}</span><span class="btn btn-soft btn-sm">View trip</span></div>
</div></a>`;
}

/* ---------- home ---------- */
function homePage() {
  const pre = "";
  const counts = { All: trips.length };
  TAGS.forEach((tg) => (counts[tg] = trips.filter((t) => (t.tags || []).includes(tg)).length));
  const highest = trips.reduce((a, t) => ((t.altitude || 0) > (a.altitude || 0) ? t : a), {});
  const pkDone = PK.filter((p) => ids.has(p.id)).length;
  const names = trips.map((t) => t.title.split(" &")[0]);
  const a = site.about || {};
  const faq = site.faq || [];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": site.url + "#shivam", name: site.name, url: site.url, sameAs: [site.instagram], description: site.description },
      { "@type": "WebSite", name: site.title, url: site.url, inLanguage: "en-IN", author: { "@id": site.url + "#shivam" } },
      ...(faq.length ? [{ "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
    ],
  };
  return head({
    title: `${site.title} · Uttarakhand travel itineraries`, description: site.description, canonical: site.url,
    image: abs("images/og.jpg"), pre, extra: ldScript(ld),
  }) + header(pre, true) + `
<main id="main">
<section class="hero">${pic(V.get("hero"), { cls: "hero-bg", sizes: "100vw", eager: true, pre })}
<div class="wrap">
<span class="eyebrow-pill">${ico("spark")}Pahadi travel journal</span>
<h1>Walk the Himalayas with me to <span class="rot" id="rot" data-names="${esc(names.join("|"))}">${esc(names[0] || "Uttarakhand")}</span></h1>
<p class="lede"><strong>Real trips, real itineraries.</strong> Photos, reels and day-by-day plans from the temples, treks and valleys of Uttarakhand.</p>
<form class="search" id="search" role="search" action="#trips">${ico("search")}<input id="q" type="search" placeholder="Where do you want to go?" aria-label="Search trips" autocomplete="off" maxlength="60"><button class="btn" type="submit">Search</button></form>
<div class="hero-cta"><a class="btn btn-ig" href="${esc(site.instagram)}" ${ext}>${ico("ig")}Follow @${esc(site.handle)}</a><small>Every trip starts and ends in Rishikesh</small></div>
</div></section>
<div class="stats"><div class="wrap">
<div class="stat"><b>${pkDone}/5</b><span>Panch Kedar done</span></div>
<div class="stat"><b>${trips.length}</b><span>Himalayan trips</span></div>
<div class="stat"><b>${esc(site.topReel)}</b><span>Views on top reel</span></div>
<div class="stat"><b>${esc(fmtAlt(highest.altitude))}</b><span>Highest stop</span></div>
</div></div>
<section class="meet" id="getting-there"><div class="wrap meet-in">
<div class="meet-lead"><span class="kicker">Meeting point</span><h2>Every trip starts in <span class="it">Rishikesh.</span></h2><p>Reach Rishikesh on your own. Day 1 of every itinerary begins there, and the last day brings you back.</p></div>
<div class="meet-ways">
<div class="way">${ico("rail")}<b>Train</b><span>Yog Nagari Rishikesh station, or Haridwar (about 25 km away) for more trains.</span></div>
<div class="way">${ico("plane")}<b>Flight</b><span>Dehradun Jolly Grant airport, about 35 km from Rishikesh.</span></div>
<div class="way">${ico("bus")}<b>Bus</b><span>Overnight buses from Delhi reach Rishikesh early in the morning.</span></div>
</div></div></section>
<section class="block" id="trips"><div class="wrap">
<div class="sec-head"><span class="kicker">From my trails</span><h2>Trip journal.</h2><p>Every place I have walked to, with how to get there, how long it takes and when to go.</p></div>
<div class="chips" role="group" aria-label="Filter trips">${["All", ...TAGS].map((tg) => `<button class="chip" type="button" data-f="${esc(tg)}" aria-pressed="${tg === "All"}">${esc(tg)} <i>${counts[tg]}</i></button>`).join("")}</div>
<div class="grid" id="grid">${trips.map((t) => card(t, pre)).join("\n")}</div>
<p class="empty" id="no-match" hidden>No trips match that yet. Try another place, or ask me on Instagram.</p>
</div></section>
<section class="block season-band" id="when-to-go"><div class="wrap">
<div class="sec-head"><span class="kicker">Plan by month</span><h2>When to go.</h2><p>Temples close for winter, the monsoon brings rain and landslides, and some places are best under snow. Pick your month and see which trips fit.</p></div>
<p class="now" id="now-good" hidden></p>
${seasonLegend}
<div class="season-wrap"><table class="season" id="season">
<caption class="sr">Season for each trip by month</caption>
<thead><tr><th scope="col">Trip</th>${MONTHS.map((m, i) => `<th scope="col" data-m="${i}">${m}</th>`).join("")}</tr></thead>
<tbody>${trips.map((t) => `<tr><th scope="row"><a href="trips/${t.id}/">${esc(t.title)}</a></th>${[...(t.months || "oooooooooooo")].map((c, i) => `<td class="${SEASON[c][0]}" data-m="${i}" data-s="${c}" title="${MONTHS[i]}: ${SEASON[c][1]}"><span class="sr">${SEASON[c][1]}</span></td>`).join("")}</tr>`).join("\n")}</tbody>
</table></div>
<p class="fine">Approximate. Temple opening and closing dates are announced every year, so check them before you book.</p>
</div></section>
<section class="block pk" id="panch-kedar"><div class="wrap">
<div class="sec-head center"><span class="kicker">Completed the circuit</span><h2>Panch Kedar, <span class="it">all five.</span></h2><p>The five temples where, as the story goes, parts of Shiva appeared after he vanished from the Pandavas as a bull. Listed in the traditional order.</p></div>
<div class="pk-row">${PK.map((p) => `<a class="pk-item" href="${ids.has(p.id) ? `trips/${p.id}/` : "#panch-kedar"}">${ids.has(p.id) ? `<span class="done" title="Visited">${ico("check")}</span>` : ""}<span class="n">KEDAR ${p.n}</span><h3>${esc(p.name)}</h3><small>Shiva’s ${esc(p.part)}</small><span class="alt">${esc(fmtAlt(p.alt))}</span></a>`).join("")}</div>
</div></section>
<section class="block" id="about"><div class="wrap about">
<div class="portrait">${pic(V.get("about"), { alt: a.photo ? site.name : "", sizes: "(max-width: 860px) 90vw, 420px", pre })}
<div class="badge"><div class="avatar"><span>SR</span></div><div><b>${esc(site.name)}</b><small>@${esc(site.handle)} · ${esc(site.base)}</small></div></div></div>
<div class="about-copy"><span class="kicker">About me</span><h2>${esc(a.heading || "Hi, I’m Shivam.")}</h2>
${(a.paragraphs || []).map((p, i) => `<p${i === (a.paragraphs.length - 1) ? ' class="soft"' : ""}>${esc(p)}</p>`).join("\n")}
<ul class="about-facts">${(a.facts || []).map((f) => `<li>${ico("check")}${esc(f)}</li>`).join("")}</ul>
</div></div></section>
${faq.length ? `<section class="block faq-band" id="faq"><div class="wrap faq">
<div class="sec-head"><span class="kicker">Before you go</span><h2>Questions people ask me.</h2><p>Quick answers to what comes up most in my DMs.</p></div>
<div class="faq-list">${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}</div>
</div></section>` : ""}
<section class="block cta-band" id="follow"><div class="wrap cta">
<div><span class="kicker">Planning your own trip?</span><h2>Pick a trail.<span class="it">I’ll help you plan it.</span></h2>
<p>Follow me on Instagram and send a DM with your dates and the place you have in mind. I reply with the route, where to stay and what to pack.</p></div>
<div class="cta-card">
<div class="handle"><div class="avatar"><span>SR</span></div><div><b>@${esc(site.handle)}</b><small>${esc(site.name)} · ${esc(site.base)}</small></div></div>
<a class="btn btn-ig" href="${esc(site.instagram)}" ${ext}>${ico("ig")}Follow @${esc(site.handle)}</a>
<a class="btn btn-line" href="${esc(site.instagram)}" ${ext}>Open my Instagram ${ico("arrow")}</a>
</div></div></section>
</main>
` + footer();
}

/* ---------- trip page ---------- */
function tripPage(t) {
  const pre = "../../";
  const media = t.media || [];
  const story = (t.story || "").trim();
  const others = trips.filter((x) => x.id !== t.id && (x.tags || []).some((g) => (t.tags || []).includes(g))).slice(0, 3);
  const more = others.length ? others : trips.filter((x) => x.id !== t.id).slice(0, 3);
  const desc = `${t.title}: ${t.summary} ${t.days}-day itinerary from Rishikesh.`.slice(0, 300);
  const url = abs(`trips/${t.id}/`);
  const cover = coverV(t);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip", name: `${t.title} from Rishikesh`, description: t.summary, url, image: abs(cover.jpg),
        touristType: (t.tags || []).join(", ") || "Trekking",
        author: { "@type": "Person", name: site.name, url: site.instagram },
        itinerary: { "@type": "ItemList", itemListElement: (t.itinerary || []).map((d, i) => ({ "@type": "ListItem", position: i + 1, name: `${d.d}: ${d.t}`, description: d.x })) },
      },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trips", item: site.url },
        { "@type": "ListItem", position: 2, name: t.title, item: url },
      ] },
    ],
  };
  const shareText = `${t.title}: ${t.days}-day itinerary from Rishikesh, by @${site.handle} ${url}`;
  return head({
    title: `${t.title} itinerary from Rishikesh · ${site.title}`, description: desc,
    canonical: url, image: abs(cover.jpg), pre, extra: ldScript(ld),
  }) + header(pre, false) + `
<nav class="crumb" aria-label="Breadcrumb"><div class="wrap"><a href="${pre}index.html#trips">${ico("back")} All trips</a><span>/</span><span>${esc(t.title)}</span></div></nav>
<main id="main">
<div class="d-hero">${pic(cover, { sizes: "100vw", eager: true, pre })}<div class="wrap">
<div class="route">${ico("pin")}${esc(t.route)}</div><h1>${esc(t.title)}</h1>
<div class="d-tags">${(t.tags || []).map((x) => `<span>${esc(x)}</span>`).join("")}<span>${esc(t.region)} district</span></div>
</div></div>
<div class="wrap d-body"><div class="d-main">
<section><h2>My experience</h2><div class="story">${story
    ? story.split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join("")
    : `<p>${esc(t.summary)}</p><p class="story-empty">The full story from this trip is coming soon. The reels are already up on Instagram.</p>`}</div></section>
${media.length ? `<section><h2>Photos &amp; videos</h2><div class="gallery">${media.map((m) => m.kind === "video"
    ? `<div class="vid"><video src="${pre}${esc(m.src)}" controls playsinline preload="metadata" aria-label="${esc(m.caption || t.title + " video")}"></video></div>`
    : `<a href="${pre}${V.get(m.src).jpg}" data-full>${pic(V.get(m.src), { alt: m.caption || t.title + " photo", sizes: "(max-width: 600px) 50vw, 260px", pre })}</a>`).join("")}</div></section>` : ""}
${(t.itinerary || []).length ? `<section><h2>Day-by-day itinerary</h2><p class="note">${ico("pin")}Starts and ends in Rishikesh. Getting to Rishikesh is on you. <a href="${pre}index.html#getting-there">How to reach</a></p><ol class="timeline">${t.itinerary.map((d) => `<li><span class="daybadge">${esc(d.d)}</span><div><h3>${esc(d.t)}</h3><p>${esc(d.x)}</p></div></li>`).join("")}</ol></section>` : ""}
${(t.tips || []).length ? `<section><h2>Tips before you go</h2><ul class="tips">${t.tips.map((x) => `<li>${ico("spark")}<span>${esc(x)}</span></li>`).join("")}</ul></section>` : ""}
</div>
<aside class="d-side">
<div class="panel"><h4>Trip facts</h4><dl class="kv">
<div><dt>${ico("peak")}Altitude</dt><dd>${esc(fmtAlt(t.altitude))} approx.</dd></div>
<div><dt>${ico("steps")}Trail</dt><dd>${esc(t.trek)}</dd></div>
<div><dt>${ico("gauge")}Difficulty</dt><dd>${esc(t.difficulty)}</dd></div>
<div><dt>${ico("clock")}Days</dt><dd>${esc(t.days)}</dd></div>
<div><dt>${ico("pin")}Meeting point</dt><dd>${esc(t.start || "Rishikesh")}</dd></div>
<div><dt>${ico("cal")}Best time</dt><dd>${esc(t.season)}</dd></div>
</dl></div>
${t.months ? `<div class="panel"><h4>Month by month</h4>${monthStrip(t)}${seasonLegend}</div>` : ""}
<div class="panel"><h4>Share this trip</h4><p>Send it to the friends you’re going with.</p>
<div class="share-row">
<a class="btn btn-soft" href="https://wa.me/?text=${encodeURIComponent(shareText)}" ${ext}>${ico("chat")}WhatsApp</a>
<button class="btn btn-line" type="button" data-share="${esc(url)}" data-title="${esc(t.title)}" hidden>${ico("share")}Share</button>
<button class="btn btn-line" type="button" data-copy="${esc(url)}" hidden>${ico("link")}Copy link</button>
</div><p class="copy-msg" aria-live="polite"></p></div>
<div class="panel"><h4>Going there?</h4><p>Follow me and DM your dates. I’ll share what worked for me.</p>
${t.reel ? `<a class="btn btn-line" href="${esc(t.reel)}" ${ext}>${ico("play")}Watch the reel</a>` : ""}
<a class="btn btn-ig" href="${esc(site.instagram)}" ${ext}>${ico("ig")}Follow on Instagram</a></div>
</aside></div>
<section class="wrap more-trips"><h2>More trips</h2><div class="grid">${more.map((x) => card(x, pre)).join("")}</div></section>
</main>
` + footer();
}

/* ---------- 404 (served at any path, so it uses root-absolute links) ---------- */
function notFoundPage() {
  const pre = BASE_PATH;
  return head({ title: `Page not found · ${site.title}`, description: site.description, canonical: site.url, image: abs("images/og.jpg"), pre,
    extra: '<meta name="robots" content="noindex">\n' }) + header(pre, false) + `
<main id="main" class="wrap notfound"><span class="kicker">404</span><h1>This trail doesn’t exist.</h1><p>The page may have moved. Head back to the trip list.</p>
<a class="btn btn-primary" href="${pre}index.html#trips">${ico("back")}All trips</a></main>
` + footer();
}

/* ---------- build ---------- */
function copyDir(src, dst, skip = () => false) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".well-known") continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (skip(s)) continue;
    e.isDirectory() ? copyDir(s, d, skip) : fs.copyFileSync(s, d);
  }
}
const RASTER = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));
// Original photos are never published as-is; only the resized, metadata-free copies made below.
copyDir(path.join(ROOT, "images"), path.join(OUT, "images"), (p) => RASTER.test(p) && path.basename(p) !== "og.jpg");
copyDir(path.join(ROOT, "static"), OUT);

const keyOf = (rel) => rel.replace(/^images\//, "").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
for (const t of trips) {
  V.set(`gen:${t.id}`, await makeVariants(await artBuffer(t.id, t.style || "day", 1200, 750), `gen-${t.id}`, [640, 1200]));
  const photos = new Set([t.cover, ...(t.media || []).filter((m) => m.kind === "image").map((m) => m.src)].filter(Boolean));
  for (const rel of photos) if (!V.has(rel)) V.set(rel, await makeVariants(path.join(ROOT, rel), keyOf(rel), [640, 1200, 1800]));
}
const heroSrc = path.join(ROOT, "images/hero.jpg");
V.set("hero", await makeVariants(fs.existsSync(heroSrc) ? heroSrc : await artBuffer("hero-uttarakhand", "dawn", 1800, 1000), "hero", [900, 1800]));
const aboutSrc = site.about?.photo ? path.join(ROOT, site.about.photo) : null;
if (aboutSrc && !fs.existsSync(aboutSrc)) throw new Error(`Missing About photo: ${site.about.photo}`);
V.set("about", await makeVariants(aboutSrc || await artBuffer("about-shivam", "dusk", 840, 1050), "about", [480, 840]));
if (!fs.existsSync(path.join(ROOT, "images/og.jpg"))) {
  const ogSvg = mountainSvg("hero-uttarakhand", "dawn", 1200, 630).replace("</svg>",
    `<rect width="1200" height="630" fill="#06121c" fill-opacity=".45"/><text x="72" y="300" font-family="DejaVu Sans, Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">${esc(site.title)}</text><text x="72" y="370" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" fill="#e6f3f9">Uttarakhand itineraries · @${esc(site.handle)}</text></svg>`);
  await sharp(Buffer.from(ogSvg)).jpeg({ quality: 84 }).toFile(path.join(OUT, "images/og.jpg"));
}
fs.writeFileSync(path.join(OUT, "favicon.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0c2a40"/><path d="M4 25l8-13 5 8 3-4 8 9z" fill="#5cbde6"/><path d="M10 15.2l2-3.2 2 3.2-2 1z" fill="#fff"/></svg>');

fs.writeFileSync(path.join(OUT, "index.html"), homePage());
for (const t of trips) {
  fs.mkdirSync(path.join(OUT, "trips", t.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, "trips", t.id, "index.html"), tripPage(t));
}
fs.writeFileSync(path.join(OUT, "404.html"), notFoundPage());
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [site.url, ...trips.map((t) => abs(`trips/${t.id}/`))].map((u) => `<url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${abs("sitemap.xml")}\n`);
const expires = new Date(Date.now() + 360 * 864e5).toISOString().replace(/\.\d+Z$/, "Z");
fs.mkdirSync(path.join(OUT, ".well-known"), { recursive: true });
fs.writeFileSync(path.join(OUT, ".well-known/security.txt"), `Contact: ${site.instagram}\nExpires: ${expires}\nPreferred-Languages: en, hi\nCanonical: ${abs(".well-known/security.txt")}\n`);
console.log(`Built ${trips.length} trip pages into _site/`);
