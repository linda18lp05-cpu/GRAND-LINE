import { createSfx } from "./audio.js";

const STORE = "mugiwara-records-v1";
const FRUIT_SRC = [
  "assets/fruit-gomu.png",
  "assets/fruit-mera.png",
  "assets/fruit-hie.png",
  "assets/fruit-yami.png",
  "assets/fruit-goro.png",
  "assets/fruit-bara.png",
];

export const CREW = [
  {
    id: "luffy",
    name: "Luffy",
    src: "assets/crew-luffy.png",
    kind: "stretch",
    shout: "Gomu Gomu no Pistol!",
    join: "Il capitano salpa per i frutti del diavolo!",
    island: "East Blue",
    color: "#c62828",
    bounty: 30000000,
    wanted: "MONKEY·D·LUFFY",
  },
  {
    id: "zoro",
    name: "Zoro",
    src: "assets/crew-zoro.png",
    kind: "slash",
    shout: "Oni Giri!",
    join: "Zoro entra in ciurma. Tre spade, zero pietà.",
    island: "Shimotsuki",
    color: "#2e7d32",
    bounty: 60000000,
    wanted: "RORONOA ZORO",
  },
  {
    id: "nami",
    name: "Nami",
    src: "assets/crew-nami.png",
    kind: "bolt",
    shout: "Thunderbolt Tempo!",
    join: "Nami porta il Clima-Tact. Arriva il temporale!",
    island: "Cocoyasi",
    color: "#ef6c00",
    bounty: 16000000,
    wanted: "NAMI",
  },
  {
    id: "usopp",
    name: "Usopp",
    src: "assets/crew-usopp.png",
    kind: "shot",
    shout: "Hissatsu Hoshi Boshi!",
    join: "Usopp il cecchino. I suoi tiri si possono schivare!",
    island: "Syrup",
    color: "#6d4c41",
    bounty: 30000000,
    wanted: "USOPP",
  },
  {
    id: "sanji",
    name: "Sanji",
    src: "assets/crew-sanji.png",
    kind: "kick",
    shout: "Diable Jambe!",
    join: "Sanji accende la gamba. Calci velocissimi!",
    island: "Baratie",
    color: "#f9a825",
    bounty: 77000000,
    wanted: "VINSMOKE SANJI",
  },
  {
    id: "chopper",
    name: "Chopper",
    src: "assets/crew-chopper.png",
    kind: "hop",
    shout: "Heavy Point!",
    join: "Chopper salta sui frutti. Cliccalo per fermarlo!",
    island: "Drum",
    color: "#ec407a",
    bounty: 50,
    wanted: "TONY TONY CHOPPER",
  },
  {
    id: "robin",
    name: "Robin",
    src: "assets/crew-robin.png",
    kind: "hands",
    shout: "Cien Fleur!",
    join: "Robin fa sbocciare le mani sotto i frutti.",
    island: "Alabasta",
    color: "#6a1b9a",
    bounty: 79000000,
    wanted: "NICO ROBIN",
  },
  {
    id: "franky",
    name: "Franky",
    src: "assets/crew-franky.png",
    kind: "beam",
    shout: "SUPER! Weapons Left!",
    join: "Franky spara il raggio. Water 7 trema!",
    island: "Water 7",
    color: "#0277bd",
    bounty: 44000000,
    wanted: "FRANKY",
  },
  {
    id: "brook",
    name: "Brook",
    src: "assets/crew-brook.png",
    kind: "soul",
    shout: "Yohohoho! Soul Parade!",
    join: "Brook suona: le anime volano sui frutti!",
    island: "Thriller Bark",
    color: "#455a64",
    bounty: 33000000,
    wanted: "BROOK",
  },
];

const BIOMES = ["eastblue", "shimotsuki", "cocoyasi", "syrup", "baratie", "drum", "alabasta", "water7", "thriller"];

export const LEVELS = CREW.map((mate, i) => {
  const n = i + 1;
  const biome = BIOMES[i];
  return {
    n,
    island: mate.island,
    joinId: mate.id,
    biome,
    bg: "assets/bg-" + biome + ".png",
    save: 6 + n * 2,
    eat: Math.max(5, 11 - n),
    time: 58 - n * 2,
    speed: 0.72 + i * 0.14,
    fruits: 12 + n,
    concurrent: Math.min(n, 1 + Math.floor(i / 3)),
  };
});

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "{}");
    return {
      name: String(raw.name || "").slice(0, 16),
      unlocked: Math.min(LEVELS.length, Math.max(1, Number(raw.unlocked) || 1)),
      best: Array.isArray(raw.best) ? raw.best.slice(0, 12) : [],
      widget: raw.widget === true,
    };
  } catch {
    return { name: "", unlocked: 1, best: [], widget: false };
  }
}

function saveStore(data) {
  localStorage.setItem(STORE, JSON.stringify(data));
}

function chroma(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const greenLead = g - Math.max(r, b);
        const neon = g > 160 && r < 110 && b < 110 && greenLead > 50;
        const lime = g > 200 && r > 80 && r < 170 && b < 80;
        if (neon || lime) px[i + 3] = 0;
      }
      ctx.putImageData(data, 0, 0);
      resolve(c);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function cropOpaque(src) {
  const w = src.width;
  const h = src.height;
  const data = src.getContext("2d").getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX) return src;
  const c = document.createElement("canvas");
  c.width = maxX - minX + 1;
  c.height = maxY - minY + 1;
  c.getContext("2d").drawImage(src, minX, minY, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

function formatBelly(n) {
  return Number(n || 0).toLocaleString("it-IT");
}

const POSTER_FLOURISH = `<svg class="flourish" viewBox="0 0 90 36" aria-hidden="true"><path fill="none" stroke="#1a120a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="M24 21c1 8-10 11-15 5-5-7 3-15 13-12 6 2 8 9 4 13"/><path fill="none" stroke="#1a120a" stroke-width="2.8" stroke-linecap="round" d="M26 13c13-13 24 13 42 2 8-5 15-3 22 6"/></svg>`;
const POSTER_BERRY = `<svg class="berry" viewBox="0 0 24 32" aria-hidden="true"><path d="M3.2 1.6h10.2c4.8 0 8.6 2.8 8.6 7 0 2.6-1.5 4.7-4 5.6 3.2 1 5.3 3.4 5.3 6.6 0 4.8-4.1 8.6-10.4 8.6H3.2V1.6zm4.2 3.6v7.2h6.1c2.8 0 4.6-1.5 4.6-3.6s-1.8-3.6-4.6-3.6H7.4zm0 10.6v8.8h6.4c3.2 0 5.2-1.7 5.2-4.4s-2-4.4-5.2-4.4H7.4z"/><rect x="-1" y="10.2" width="26" height="2.3"/><rect x="-1" y="16.6" width="26" height="2.3"/></svg>`;

function posterHtml({ photo, name, bounty, foot }) {
  const long = String(name).length > 14 ? " long" : "";
  return `
    <svg class="wanted-banner" viewBox="0 0 200 38" role="img" aria-label="WANTED">
      <text x="100" y="32" text-anchor="middle" textLength="196" lengthAdjust="spacingAndGlyphs" font-family="Playfair Display, Bodoni Moda, Times New Roman, serif" font-weight="900" fill="#5a3510" font-size="36">WANTED</text>
    </svg>
    <span class="wanted-photo"><img alt="" src="${photo}" /></span>
    <span class="wanted-alive">${POSTER_FLOURISH}<span>DEAD OR ALIVE</span>${POSTER_FLOURISH}</span>
    <em class="wanted-name${long}">${name}</em>
    <b class="bounty">${POSTER_BERRY} ${bounty}</b>
    <span class="wanted-foot"><small>${foot}</small><strong>MARINE</strong></span>`;
}

function formatBounty(n) {
  return `${formatBelly(n)} Belly`;
}

function clampName(v) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, 16) || "Nakama";
}

export function mountCampaign({ sfx, api, onExit, onWidgetChange, onParkDesktop }) {
  const root = document.getElementById("campaign");
  const home = document.getElementById("campHome");
  const menu = document.getElementById("campMenu");
  const intro = document.getElementById("campIntro");
  const play = document.getElementById("campPlay");
  const board = document.getElementById("campBoard");
  const over = document.getElementById("campOver");
  const islandsEl = document.getElementById("islands");
  const nameEl = document.getElementById("pirateName");
  const pickWidgetOn = document.getElementById("pickWidgetOn");
  const pickWidgetOff = document.getElementById("pickWidgetOff");
  const widgetHint = document.getElementById("widgetHint");
  const fruitsEl = document.getElementById("campFruits");
  const crewEl = document.getElementById("campCrew");
  const fx = document.getElementById("campFx");
  const ctx = fx.getContext("2d");
  const hitsEl = document.getElementById("campHits");
  const speechEl = document.getElementById("campSpeech");
  const timerEl = document.getElementById("campTimer");
  const savedEl = document.getElementById("campSaved");
  const eatenEl = document.getElementById("campEaten");
  const scoreEl = document.getElementById("campScore");
  const levelEl = document.getElementById("campLevel");
  const wantedList = document.getElementById("wantedList");
  const joinArt = document.getElementById("joinArt");
  const joinLevel = document.getElementById("joinLevel");
  const joinName = document.getElementById("joinName");
  const joinQuote = document.getElementById("joinQuote");
  const joinBounty = document.getElementById("joinBounty");
  const overTitle = document.getElementById("overTitle");
  const overSub = document.getElementById("overSub");
  const overScore = document.getElementById("overScore");
  const btnNext = document.getElementById("btnNext");
  const btnRetry = document.getElementById("btnRetry");
  const skyEl = document.getElementById("campSky");
  const skyArt = document.getElementById("skyArt");
  const wx = document.getElementById("skyWx");
  const wxCtx = wx.getContext("2d");

  const art = { crew: {}, fruits: [] };
  const sounds = sfx || createSfx();
  let store = loadStore();
  let open = false;
  let screen = "splash";
  let loaded = false;
  let selected = 1;
  let run = null;
  let last = performance.now();
  let raf = 0;
  let biome = "menu";
  let flakes = [];

  const WEATHER = {
    menu: { bg: "assets/grandline-bg.png", kind: "sparkle" },
    eastblue: { bg: "assets/bg-eastblue.png", kind: "sparkle" },
    shimotsuki: { bg: "assets/bg-shimotsuki.png", kind: "leaf" },
    cocoyasi: { bg: "assets/bg-cocoyasi.png", kind: "petal" },
    syrup: { bg: "assets/bg-syrup.png", kind: "pollen" },
    baratie: { bg: "assets/bg-baratie.png", kind: "steam" },
    drum: { bg: "assets/bg-drum.png", kind: "snow" },
    alabasta: { bg: "assets/bg-alabasta.png", kind: "sand" },
    water7: { bg: "assets/bg-water7.png", kind: "bubble" },
    thriller: { bg: "assets/bg-thriller.png", kind: "fog" },
  };

  function makeFlake(kind) {
    return {
      kind,
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      z: 0.45 + Math.random() * 1.3,
      a: Math.random() * Math.PI * 2,
      r: 2 + Math.random() * 6,
      spin: (Math.random() - 0.5) * 2,
    };
  }

  function resetFlake(p, kind) {
    p.kind = kind;
    if (kind === "sand") {
      p.x = -12;
      p.y = Math.random() * innerHeight;
    } else if (kind === "steam" || kind === "bubble" || kind === "sparkle") {
      p.x = Math.random() * innerWidth;
      p.y = innerHeight + 12;
    } else if (kind === "fog") {
      p.x = -80;
      p.y = 30 + Math.random() * innerHeight * 0.55;
      p.r = 28 + Math.random() * 50;
    } else {
      p.x = Math.random() * innerWidth;
      p.y = -16;
    }
  }

  function setBiome(name) {
    biome = WEATHER[name] ? name : "menu";
    const spec = WEATHER[biome];
    skyEl.className = "biome-" + biome;
    skyArt.style.backgroundImage = `url("${spec.bg}")`;
    const count = spec.kind === "snow" ? 80 : spec.kind === "sand" ? 55 : spec.kind === "fog" ? 16 : spec.kind === "leaf" ? 30 : 36;
    flakes = Array.from({ length: count }, () => makeFlake(spec.kind));
  }

  function drawWater(now) {
    const wet = biome === "menu" || biome === "eastblue" || biome === "cocoyasi" || biome === "baratie" || biome === "water7" || biome === "thriller";
    if (!wet) return;
    const w = wx.width;
    const h = wx.height;
    const t = now * 0.001;
    const bands = [
      { y: 0.54, amp: 18, len: 0.009, speed: 1.7, color: "rgba(255,255,255,.38)" },
      { y: 0.62, amp: 22, len: 0.012, speed: 2.2, color: "rgba(70, 175, 255, .32)" },
      { y: 0.71, amp: 16, len: 0.015, speed: 2.6, color: "rgba(255,255,255,.26)" },
      { y: 0.80, amp: 24, len: 0.01, speed: 1.4, color: "rgba(18, 86, 168, .36)" },
    ];
    bands.forEach((b, i) => {
      wxCtx.beginPath();
      const yBase = h * b.y;
      wxCtx.moveTo(0, h);
      wxCtx.lineTo(0, yBase);
      for (let x = 0; x <= w; x += 6) {
        const y = yBase
          + Math.sin(x * b.len + t * b.speed + i) * b.amp
          + Math.sin(x * b.len * 2.1 - t * b.speed * 1.35) * (b.amp * 0.38);
        wxCtx.lineTo(x, y);
      }
      wxCtx.lineTo(w, h);
      wxCtx.closePath();
      wxCtx.fillStyle = b.color;
      wxCtx.fill();
    });
  }

  function stepWeather(dt, now) {
    const spec = WEATHER[biome] || WEATHER.menu;
    const kind = spec.kind;
    wx.width = innerWidth;
    wx.height = innerHeight;
    wxCtx.clearRect(0, 0, wx.width, wx.height);
    drawWater(now);
    flakes.forEach((p) => {
      p.a += dt * (0.8 + p.spin);
      if (kind === "snow") {
        p.y += 55 * p.z * dt;
        p.x += Math.sin(p.a) * 28 * dt;
      } else if (kind === "leaf" || kind === "petal") {
        p.y += 38 * p.z * dt;
        p.x += Math.sin(p.a * 1.4) * 46 * dt;
      } else if (kind === "pollen") {
        p.y += 12 * p.z * dt;
        p.x += Math.sin(p.a) * 22 * dt;
      } else if (kind === "sand") {
        p.x += (90 + p.z * 50) * dt;
        p.y += Math.sin(p.a) * 18 * dt;
      } else if (kind === "steam") {
        p.y -= (35 + p.z * 20) * dt;
        p.x += Math.sin(p.a) * 16 * dt;
      } else if (kind === "bubble" || kind === "sparkle") {
        p.y -= (28 + p.z * 24) * dt;
        p.x += Math.sin(p.a) * 18 * dt;
      } else if (kind === "fog") {
        p.x += (18 + p.z * 10) * dt;
        p.y += Math.sin(p.a) * 8 * dt;
      }
      if (p.x < -90 || p.x > innerWidth + 90 || p.y < -40 || p.y > innerHeight + 40) resetFlake(p, kind);

      wxCtx.save();
      wxCtx.translate(p.x, p.y);
      if (kind === "leaf" || kind === "petal") wxCtx.rotate(p.a);
      if (kind === "snow") {
        wxCtx.fillStyle = "rgba(255,255,255,.9)";
        wxCtx.beginPath();
        wxCtx.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "leaf") {
        wxCtx.fillStyle = p.z > 1 ? "#e65100" : "#ff8a65";
        wxCtx.beginPath();
        wxCtx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "petal") {
        wxCtx.fillStyle = "#ff9800";
        wxCtx.beginPath();
        wxCtx.ellipse(0, 0, p.r * 0.7, p.r * 0.4, 0, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "pollen") {
        wxCtx.fillStyle = "rgba(255, 235, 59, .75)";
        wxCtx.beginPath();
        wxCtx.arc(0, 0, 2.2 * p.z, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "sand") {
        wxCtx.fillStyle = "rgba(255, 213, 79, .7)";
        wxCtx.beginPath();
        wxCtx.arc(0, 0, 1.6 * p.z, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "steam") {
        wxCtx.fillStyle = "rgba(255,255,255,.28)";
        wxCtx.beginPath();
        wxCtx.arc(0, 0, p.r * 1.4, 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "bubble") {
        wxCtx.strokeStyle = "rgba(178, 235, 242, .85)";
        wxCtx.lineWidth = 2;
        wxCtx.beginPath();
        wxCtx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2);
        wxCtx.stroke();
      } else if (kind === "sparkle") {
        wxCtx.fillStyle = "rgba(255, 249, 196, .85)";
        wxCtx.beginPath();
        wxCtx.arc(0, 0, 1.8 + Math.sin(p.a * 3), 0, Math.PI * 2);
        wxCtx.fill();
      } else if (kind === "fog") {
        wxCtx.fillStyle = "rgba(170, 140, 200, .16)";
        wxCtx.beginPath();
        wxCtx.ellipse(0, 0, p.r * 2.2, p.r * 0.9, 0, 0, Math.PI * 2);
        wxCtx.fill();
      }
      wxCtx.restore();
    });
    if (kind === "fog") {
      wxCtx.strokeStyle = "rgba(20,10,30,.45)";
      wxCtx.lineWidth = 2;
      flakes.slice(0, 6).forEach((p, i) => {
        const bx = (p.x * 1.4 + now * 0.04 * (i + 1)) % (innerWidth + 80) - 40;
        const by = 50 + (i * 37) % Math.max(80, innerHeight * 0.4);
        wxCtx.beginPath();
        wxCtx.moveTo(bx, by);
        wxCtx.lineTo(bx + 8, by + 6);
        wxCtx.moveTo(bx, by);
        wxCtx.lineTo(bx - 8, by + 6);
        wxCtx.stroke();
      });
    }
  }

  function showScreen(name) {
    screen = name;
    const map = { splash: home, home, menu, intro, play, playing: play, board, over };
    for (const el of [home, menu, intro, play, board, over]) el.classList.remove("on");
    (map[name] || home).classList.add("on");
  }

  function pirateName() {
    return clampName(nameEl.value || store.name);
  }

  function persistName() {
    store.name = pirateName();
    nameEl.value = store.name;
    saveStore(store);
  }

  function syncWidgetUI() {
    if (pickWidgetOn) pickWidgetOn.classList.toggle("hide", store.widget === true);
    if (pickWidgetOff) {
      pickWidgetOff.classList.toggle("hide", store.widget !== true);
      pickWidgetOff.classList.toggle("choice-mini", store.widget === true);
    }
  }

  function setWidgetHint(text) {
    if (widgetHint) widgetHint.textContent = text || "";
  }

  function setWidget(on) {
    return Promise.resolve()
      .then(async () => {
        if (on) {
          if (typeof api.installWidget !== "function") return false;
          const result = await api.installWidget();
          if (!result || !result.ok) {
            setWidgetHint("Non riesco a mettere Luffy sul desktop.");
            return false;
          }
          setWidgetHint("");
        } else if (typeof api.uninstallWidget === "function") {
          const result = await api.uninstallWidget();
          if (result && Array.isArray(result.leftover) && result.leftover.length) {
            setWidgetHint("Non riesco a togliere l'icona dal desktop.");
          } else {
            setWidgetHint("");
          }
        } else {
          setWidgetHint("");
        }
        store.widget = Boolean(on);
        saveStore(store);
        syncWidgetUI();
        if (onWidgetChange) onWidgetChange(store.widget);
        return true;
      })
      .catch(() => false);
  }

  function renderIslands() {
    islandsEl.innerHTML = "";
    LEVELS.forEach((lv) => {
      const mate = CREW[lv.n - 1];
      const locked = lv.n > store.unlocked;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "island" + (locked ? " locked" : "") + (lv.n === selected ? " pick" : "");
      const photo = art.crew[mate.id] || mate.src;
      btn.innerHTML = locked
        ? posterHtml({
            photo,
            name: "??????",
            bounty: "???.???.???",
            foot: `this notice is classified · island ${lv.n} · marine headquarters fleet`,
          })
        : posterHtml({
            photo,
            name: mate.wanted || mate.name.toUpperCase(),
            bounty: formatBelly(mate.bounty),
            foot: `this notice is issued under marine law · ${lv.island} · bounty payable upon capture`,
          });
      btn.addEventListener("click", () => {
        if (locked) {
          speech("Ancora chiuso! Vince i livelli prima, nakama!");
          sounds.slap();
          return;
        }
        persistName();
        run = { keepScore: false, score: 0 };
        startLevel(lv.n);
      });
      islandsEl.appendChild(btn);
    });
  }

  function renderWanted() {
    const list = [...store.best]
      .filter((row) => Number(row.score) > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    if (!list.length) {
      wantedList.innerHTML = `<p class="empty-board">Nessun ricercato... per ora. Salpa e lascia il tuo nome!</p>`;
      return;
    }
    wantedList.innerHTML = list.map((row, i) => {
      const tilt = ((i % 3) - 1) * 3;
      const mate = CREW[Math.max(0, (row.level || 1) - 1)];
      return `<article class="wanted" style="--tilt:${tilt}deg">
        <div class="wanted-top">WANTED</div>
        <img alt="" src="${art.crew[mate.id] || mate.src}" />
        <div class="wanted-name">${row.name}</div>
        <div class="wanted-bounty">${(row.score * 1000).toLocaleString("it-IT")} ฿</div>
        <div class="wanted-meta">Isola ${row.level} · ${row.fruits} frutti</div>
      </article>`;
    }).join("");
  }

  function speech(text) {
    speechEl.textContent = text;
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");
  }

  function resizeFx() {
    fx.width = innerWidth;
    fx.height = innerHeight;
  }

  function scatter(count, size) {
    const w = innerWidth;
    const h = innerHeight;
    const topSafe = 56;
    const bottomSafe = Math.round(Math.max(132, h * 0.2));
    const side = 14;
    const xSpan = Math.max(48, w - size - side * 2);
    const ySpan = Math.max(48, h - size - topSafe - bottomSafe);
    const minGap = Math.max(52, size * 0.82);
    const placed = [];
    let guard = 0;
    while (placed.length < count && guard++ < 1200) {
      const x = side + Math.random() * xSpan;
      const y = topSafe + Math.random() * ySpan;
      if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < minGap)) continue;
      placed.push({
        uid: "c" + placed.length,
        x,
        y,
        src: art.fruits[placed.length % Math.max(1, art.fruits.length)] || FRUIT_SRC[placed.length % FRUIT_SRC.length],
        eaten: false,
      });
    }
    return placed;
  }

  function fruitEl(id) {
    return fruitsEl.querySelector(`[data-fid="${id}"]`);
  }

  function fruitCenter(id) {
    const el = fruitEl(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
  }

  function fighterEl(id) {
    return crewEl.querySelector(`[data-crew="${id}"]`);
  }

  function origin(id, kind) {
    const el = fighterEl(id);
    if (!el) return { x: innerWidth / 2, y: innerHeight - 28 };
    const r = el.getBoundingClientRect();
    if (kind === "stretch") {
      return {
        x: r.left + r.width * 0.42,
        y: r.top + r.height * 0.38,
      };
    }
    if (kind === "slash") {
      return {
        x: r.left + r.width * 0.52,
        y: r.top + r.height * 0.18,
      };
    }
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.28 };
  }

  function liveFruits() {
    return run.files.filter((f) => !f.eaten);
  }

  function pickTarget(busy) {
    const live = liveFruits().filter((f) => !busy.has(f.uid));
    if (!live.length) return null;
    return live[Math.floor(Math.random() * live.length)].uid;
  }

  function renderFruits() {
    fruitsEl.innerHTML = "";
    const size = run.size;
    run.files.forEach((f) => {
      if (f.eaten) return;
      const el = document.createElement("button");
      el.className = "fruit camp-fruit";
      el.type = "button";
      el.dataset.hit = "1";
      el.dataset.fid = f.uid;
      el.setAttribute("aria-label", "Frutto del diavolo");
      el.style.left = f.x + "px";
      el.style.top = f.y + "px";
      el.style.width = size + "px";
      el.style.height = size + "px";
      const img = document.createElement("img");
      img.alt = "";
      img.src = f.src;
      el.appendChild(img);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        saveFruit(f.uid);
      });
      fruitsEl.appendChild(el);
    });
  }

  function renderCrew() {
    crewEl.innerHTML = "";
    crewEl.style.setProperty("--n", String(run.roster.length));
    run.roster.forEach((mate, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fighter";
      btn.dataset.hit = "1";
      btn.dataset.crew = mate.id;
      btn.style.setProperty("--d", `${i * 0.12}s`);
      btn.innerHTML = `<img alt="${mate.name}" src="${art.crew[mate.id] || mate.src}" /><span>${mate.name}</span>`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        interruptFighter(mate.id);
      });
      crewEl.appendChild(btn);
    });
  }

  function updateHud() {
    const lv = run.level;
    const m = Math.floor(run.time / 60);
    const s = Math.floor(run.time % 60).toString().padStart(2, "0");
    timerEl.textContent = m + ":" + s;
    savedEl.textContent = run.saved + "/" + lv.save;
    eatenEl.textContent = run.eaten + "/" + lv.eat;
    scoreEl.textContent = String(run.score);
    levelEl.textContent = `Lv.${lv.n} ${lv.island}`;
  }

  function cancelAttacksOn(id) {
    run.attacks.forEach((a) => {
      if (a.targetId === id && a.alive) {
        a.alive = false;
        a.killed = true;
      }
    });
  }

  function saveFruit(id) {
    if (screen !== "playing" || !run) return;
    const f = run.files.find((x) => x.uid === id);
    if (!f || f.eaten) return;
    const threatened = run.attacks.some((a) => a.alive && a.targetId === id);
    if (!threatened) return;
    cancelAttacksOn(id);
    f.eaten = "saved";
    run.saved += 1;
    run.totalSaved = (run.totalSaved || 0) + 1;
    run.combo += 1;
    run.score += 50 + Math.min(80, run.combo * 8);
    const el = fruitEl(id);
    if (el) {
      el.classList.add("saved");
      setTimeout(() => el.remove(), 220);
    }
    sounds.slap();
    updateHud();
    if (run.saved >= run.level.save) finishLevel(true);
  }

  function eatFruit(id, mate) {
    if (screen !== "playing" || !run) return;
    const f = run.files.find((x) => x.uid === id);
    if (!f || f.eaten) return;
    f.eaten = "eaten";
    run.eaten += 1;
    run.combo = 0;
    const el = fruitEl(id);
    if (el) {
      if (mate.kind === "slash") {
        el.classList.add("sliced");
        setTimeout(() => el.remove(), 420);
      } else {
        const o = origin(mate.id, mate.kind);
        el.style.setProperty("--mx", o.x + "px");
        el.style.setProperty("--my", o.y + "px");
        el.classList.add("eaten");
        setTimeout(() => el.remove(), 380);
      }
    }
    sounds.chomp();
    speech(mate.shout.replace("!", "") + " ...umpfh!");
    updateHud();
    if (run.eaten >= run.level.eat) finishLevel(false);
  }

  function interruptFighter(id) {
    if (screen !== "playing" || !run) return;
    const atk = run.attacks.find((a) => a.alive && a.fighterId === id);
    if (!atk) return;
    atk.alive = false;
    atk.killed = true;
    run.score += 20;
    run.saved += 1;
    sounds.slap();
    const el = fighterEl(id);
    if (el) {
      el.classList.remove("strike");
      el.classList.add("hurt");
      setTimeout(() => el.classList.remove("hurt"), 280);
    }
    const fruit = fruitEl(atk.targetId);
    if (fruit) fruit.classList.remove("danger");
    speech("Ah! Mani a posto, nakama!");
    updateHud();
    if (run.saved >= run.level.save) finishLevel(true);
  }

  function interruptAttack(atk) {
    if (!atk.alive) return;
    atk.alive = false;
    atk.killed = true;
    run.score += 25;
    run.saved += 1;
    sounds.slap();
    const fruit = fruitEl(atk.targetId);
    if (fruit) fruit.classList.remove("danger");
    updateHud();
    if (run.saved >= run.level.save) finishLevel(true);
  }

  function launchAttack() {
    const busy = new Set(run.attacks.filter((a) => a.alive).map((a) => a.fighterId));
    const busyFruit = new Set(run.attacks.filter((a) => a.alive).map((a) => a.targetId));
    if (busy.size >= run.level.concurrent) return;
    const free = run.roster.filter((m) => !busy.has(m.id) && (run.cd[m.id] || 0) <= 0);
    if (!free.length) return;
    const mate = free[Math.floor(Math.random() * free.length)];
    const targetId = pickTarget(busyFruit);
    if (!targetId) return;
    const dest = fruitCenter(targetId);
    if (!dest) return;
    const from = origin(mate.id, mate.kind);
    const speed = run.level.speed;
    const durMap = {
      stretch: 2.15,
      slash: 0.95,
      bolt: 1.05,
      shot: 1.65,
      kick: 0.78,
      hop: 1.25,
      hands: 1.35,
      beam: 0.85,
      soul: 1.25,
    };
    const atk = {
      id: "a" + (run.atkN += 1),
      fighterId: mate.id,
      kind: mate.kind,
      targetId,
      from,
      t: 0,
      dur: Math.max(0.38, (durMap[mate.kind] || 1) / speed),
      alive: true,
      killed: false,
    };
    run.attacks.push(atk);
    run.cd[mate.id] = Math.max(0.55, 1.7 / speed);
    dest.el.classList.add("danger");
    const fel = fighterEl(mate.id);
    if (fel) {
      fel.classList.add("strike");
      setTimeout(() => fel.classList.remove("strike"), 260);
    }
    sounds.woosh();
    if (mate.kind === "slash") sounds.slash();
    if (mate.kind === "bolt") sounds.zap();
    if (mate.kind === "beam") sounds.beam();
    if (mate.kind === "kick") sounds.kick();
    speech(mate.shout);
  }

  function bezierPoint(a, c, b, t) {
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    };
  }

  function bezierAngle(a, c, b, t) {
    const d = 0.02;
    const p0 = bezierPoint(a, c, b, Math.max(0, t - d));
    const p1 = bezierPoint(a, c, b, Math.min(1, t + d));
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }

  function rubberPath(from, to, k) {
    const t = 1 - Math.pow(1 - Math.min(1, k), 1.55);
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const sag = Math.sin(t * Math.PI) * Math.min(130, dist * 0.32);
    const side = to.x >= from.x ? -72 : 72;
    const ctrl = {
      x: from.x + side * (0.55 + (1 - t) * 0.7),
      y: from.y - 24 + sag * 0.35,
    };
    return { end, ctrl, t };
  }

  function drawLuffyFist(x, y, ang, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#f0b27a";
    ctx.strokeStyle = "#b56a3e";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(10, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const fy = -10 + i * 6.6;
      ctx.beginPath();
      ctx.ellipse(22, fy, 7.5, 4.2, 0.15, 0, Math.PI * 2);
      ctx.fillStyle = "#e39b6a";
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(6, 14, 7, 5, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#f0b27a";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-6, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawStretch(from, to, k) {
    const { end, ctrl, t } = rubberPath(from, to, k);
    const steps = 28;
    const wristT = 0.86;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const p = (i / steps) * wristT;
      const pt = bezierPoint(from, ctrl, end, p);
      const ang = bezierAngle(from, ctrl, end, p);
      const w = 30 - 14 * (p / wristT) + Math.sin(p * 18 + t * 6) * 1.6;
      pts.push({ x: pt.x, y: pt.y, ang, w: Math.max(10, w) });
    }
    const wrist = pts[pts.length - 1];
    ctx.save();
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const nx = Math.cos(pt.ang + Math.PI / 2);
      const ny = Math.sin(pt.ang + Math.PI / 2);
      const x = pt.x + nx * pt.w / 2;
      const y = pt.y + ny * pt.w / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = pts.length - 1; i >= 0; i--) {
      const nx = Math.cos(pts[i].ang + Math.PI / 2);
      const ny = Math.sin(pts[i].ang + Math.PI / 2);
      ctx.lineTo(pts[i].x - nx * pts[i].w / 2, pts[i].y - ny * pts[i].w / 2);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#e8a56f";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#b56a3e";
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const nx = Math.cos(pt.ang + Math.PI / 2);
      const ny = Math.sin(pt.ang + Math.PI / 2);
      const x = pt.x - nx * pt.w * 0.22;
      const y = pt.y - ny * pt.w * 0.22;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgba(255, 220, 180, .55)";
    ctx.lineWidth = 5;
    ctx.stroke();
    const rings = 7;
    for (let i = 1; i < rings; i++) {
      const p = (i / rings) * wristT;
      const pt = bezierPoint(from, ctrl, end, p);
      const ang = bezierAngle(from, ctrl, end, p);
      const w = 28 - 12 * (p / wristT);
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, w * 0.22, w * 0.52, ang, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 74, 42, .45)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    drawLuffyFist(wrist.x, wrist.y, wrist.ang, 0.92 + t * 0.18);
    return end;
  }

  function drawSlash(from, to, k) {
    const t = Math.min(1, k * 1.28);
    const reach = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    const blades = [
      { off: -20, ang: -0.62, color: "#dcedc8" },
      { off: 0, ang: 0.08, color: "#fffde7" },
      { off: 18, ang: 0.7, color: "#81c784" },
    ];
    blades.forEach((b, i) => {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.55 + t * 0.45;
      ctx.lineWidth = 7 - i;
      ctx.beginPath();
      ctx.moveTo(from.x + b.off * 0.35, from.y);
      ctx.lineTo(reach.x + b.off, reach.y);
      ctx.stroke();
      ctx.restore();
    });
    const cut = Math.max(0, (t - 0.42) / 0.58);
    if (cut > 0) {
      blades.forEach((b) => {
        const len = 18 + cut * 58;
        ctx.save();
        ctx.translate(to.x, to.y);
        ctx.rotate(b.ang);
        ctx.strokeStyle = b.color;
        ctx.lineCap = "round";
        ctx.shadowColor = "#c5e1a5";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 5;
        ctx.globalAlpha = cut;
        ctx.beginPath();
        ctx.moveTo(-len, b.off * 0.12);
        ctx.lineTo(len, b.off * 0.12);
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-len * 0.7, b.off * 0.12);
        ctx.lineTo(len * 0.7, b.off * 0.12);
        ctx.stroke();
        ctx.restore();
      });
    }
    return reach;
  }

  function drawBolt(from, to, k) {
    const t = Math.min(1, k * 1.2);
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const jx = (Math.random() - 0.5) * 28;
      ctx.lineTo(from.x + (end.x - from.x) * p + jx, from.y + (end.y - from.y) * p);
    }
    ctx.strokeStyle = "#fff59d";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "#29b6f6";
    ctx.lineWidth = 2;
    ctx.stroke();
    return end;
  }

  function drawShot(from, to, k) {
    const end = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
    ctx.beginPath();
    ctx.arc(end.x, end.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#6d4c41";
    ctx.fill();
    ctx.strokeStyle = "#1b140c";
    ctx.lineWidth = 3;
    ctx.stroke();
    return end;
  }

  function drawKick(from, to, k) {
    const t = 1 - Math.pow(1 - k, 3);
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    const grd = ctx.createLinearGradient(from.x, from.y, end.x, end.y);
    grd.addColorStop(0, "rgba(255,140,0,0)");
    grd.addColorStop(1, "#ff6d00");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();
    return end;
  }

  function drawHop(from, to, k) {
    const t = k;
    const arc = Math.sin(t * Math.PI) * 90;
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - arc };
    const el = fighterEl("chopper");
    if (el) {
      el.style.transform = `translate(${end.x - from.x}px, ${end.y - from.y}px) scale(1.08)`;
    }
    return end;
  }

  function drawHands(from, to, k) {
    const pulse = 10 + Math.sin(k * 18) * 4;
    ctx.beginPath();
    ctx.arc(to.x, to.y, pulse + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(156,39,176,.55)";
    ctx.lineWidth = 4;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + k * 6;
      ctx.beginPath();
      ctx.ellipse(to.x + Math.cos(a) * 22, to.y + Math.sin(a) * 14, 7, 11, a, 0, Math.PI * 2);
      ctx.fillStyle = "#f3c39a";
      ctx.fill();
      ctx.strokeStyle = "#1b140c";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    return { x: to.x, y: to.y };
  }

  function drawSoul(from, to, k) {
    const t = 1 - Math.pow(1 - k, 2);
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    ctx.beginPath();
    ctx.arc(end.x, end.y, 24 + Math.sin(k * 14) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ce93d8";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(end.x, end.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fill();
    ctx.strokeStyle = "#6a1b9a";
    ctx.lineWidth = 2;
    ctx.stroke();
    return end;
  }

  function drawBeam(from, to, k) {
    const t = Math.min(1, k * 1.5);
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.stroke();
    return end;
  }

  const drawers = {
    stretch: drawStretch,
    slash: drawSlash,
    bolt: drawBolt,
    shot: drawShot,
    kick: drawKick,
    hop: drawHop,
    hands: drawHands,
    beam: drawBeam,
    soul: drawSoul,
  };

  function syncHits() {
    const live = run.attacks.filter((a) => a.alive);
    const used = new Set();
    live.forEach((a) => {
      if (!a.tip) return;
      let btn = hitsEl.querySelector(`[data-atk="${a.id}"]`);
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "atk-hit";
        btn.dataset.hit = "1";
        btn.dataset.atk = a.id;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const cur = run.attacks.find((x) => x.id === a.id);
          if (cur) interruptAttack(cur);
        });
        hitsEl.appendChild(btn);
      }
      btn.style.left = a.tip.x + "px";
      btn.style.top = a.tip.y + "px";
      used.add(a.id);
    });
    [...hitsEl.children].forEach((el) => {
      if (!used.has(el.dataset.atk)) el.remove();
    });
  }

  function tick(now) {
    if (!open) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepWeather(dt, now);
    if (screen === "playing" && run) {
      run.time -= dt;
      if (run.time <= 0) {
        run.time = 0;
        finishLevel(run.saved >= run.level.save);
      } else {
        Object.keys(run.cd).forEach((k) => {
          run.cd[k] -= dt;
        });
        run.next -= dt;
        if (run.next <= 0) {
          launchAttack();
          run.next = Math.max(0.42, 1.2 / run.level.speed);
        }
        resizeFx();
        ctx.clearRect(0, 0, fx.width, fx.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, fx.width, Math.max(80, fx.height - Math.round(fx.height * 0.155)));
        ctx.clip();
        const chopper = fighterEl("chopper");
        if (chopper && !run.attacks.some((a) => a.alive && a.kind === "hop")) {
          chopper.style.transform = "";
        }
        run.attacks.forEach((a) => {
          if (!a.alive) return;
          a.t += dt;
          const dest = fruitCenter(a.targetId);
          if (!dest) {
            a.alive = false;
            return;
          }
          a.from = origin(a.fighterId, a.kind);
          const k = Math.min(1, a.t / a.dur);
          const draw = drawers[a.kind] || drawStretch;
          a.tip = draw(a.from, dest, k);
          if (k >= 1) {
            dest.el.classList.remove("danger");
            const mate = run.roster.find((m) => m.id === a.fighterId);
            eatFruit(a.targetId, mate || CREW[0]);
            a.alive = false;
            if (a.kind === "hop") {
              const el = fighterEl("chopper");
              if (el) el.style.transform = "";
            }
          }
        });
        run.attacks = run.attacks.filter((a) => a.alive || a.t < a.dur + 0.2);
        ctx.restore();
        syncHits();
        updateHud();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function startLevel(n) {
    persistName();
    const lv = LEVELS[n - 1];
    if (!lv) return;
    selected = n;
    const roster = CREW.slice(0, n);
    const newbie = CREW[n - 1];
    run = {
      level: lv,
      roster,
      files: [],
      saved: 0,
      eaten: 0,
      time: lv.time,
      score: run && run.keepScore ? run.score : 0,
      combo: 0,
      totalSaved: run && run.keepScore ? (run.totalSaved || 0) : 0,
      recorded: false,
      attacks: [],
      cd: {},
      next: 0.7,
      atkN: 0,
      size: Math.max(58, 74 - n * 2),
      keepScore: true,
    };
    joinArt.src = art.crew[newbie.id] || newbie.src;
    joinLevel.textContent = `LIVELLO ${lv.n} · ${lv.island}`;
    joinName.textContent = n === 1 ? `${newbie.name} salpa!` : `${newbie.name} si unisce alla ciurma!`;
    joinQuote.textContent = newbie.join;
    if (joinBounty) joinBounty.textContent = formatBounty(newbie.bounty);
    setBiome(lv.biome);
    showScreen("intro");
    sounds.join();
    setTimeout(() => {
      if (!open || screen !== "intro") return;
      run.files = scatter(lv.fruits, run.size);
      renderFruits();
      renderCrew();
      hitsEl.innerHTML = "";
      updateHud();
      speech("Clicca solo i frutti che stanno per prendere!");
      showScreen("playing");
      sounds.start();
    }, 1600);
  }

  function commitRecord(wonAll) {
    persistName();
    if (!run || run.recorded || run.score <= 0) return;
    run.recorded = true;
    store.best.push({
      name: pirateName(),
      score: run.score,
      level: run.level.n,
      fruits: run.totalSaved || run.saved,
      at: Date.now(),
      king: Boolean(wonAll),
    });
    store.best = store.best.sort((a, b) => b.score - a.score).slice(0, 12);
    saveStore(store);
  }

  function unlockNext() {
    store.unlocked = Math.min(LEVELS.length, Math.max(store.unlocked, run.level.n + 1));
    saveStore(store);
  }

  function finishLevel(won) {
    if (screen !== "playing") return;
    run.attacks.forEach((a) => { a.alive = false; });
    hitsEl.innerHTML = "";
    const chopper = fighterEl("chopper");
    if (chopper) chopper.style.transform = "";
    if (won) {
      const leftover = Math.floor(run.time);
      run.score += leftover * 10 + run.level.n * 200;
      unlockNext();
      const lastLv = run.level.n >= LEVELS.length;
      if (lastLv) {
        run.score += 2000;
        commitRecord(true);
        overTitle.textContent = "RE DEI PIRATI!";
        overSub.textContent = `${pirateName()} ha salvato la Grand Line. La ciurma è furiosa... e un po' affamata.`;
        btnNext.classList.add("hide");
        sounds.gear();
      } else {
        overTitle.textContent = "ISOLA SUPERATA";
        overSub.textContent = `${CREW[run.level.n - 1].name} è stato fermato! Prossimo: ${LEVELS[run.level.n].island}.`;
        btnNext.classList.remove("hide");
        sounds.join();
      }
    } else {
      commitRecord(false);
      overTitle.textContent = "GEAR... TROPPO TARDI";
      overSub.textContent = `La ciurma ha mangiato troppi frutti. Il nome di ${pirateName()} resta sulla bacheca.`;
      btnNext.classList.add("hide");
      sounds.scream();
    }
    overScore.textContent = `Punteggio ${run.score} · Livello ${run.level.n} · ${pirateName()}`;
    showScreen("over");
  }

  async function preload() {
    if (loaded) return;
    for (const mate of CREW) {
      try {
        art.crew[mate.id] = cropOpaque(await chroma(mate.src)).toDataURL("image/png");
      } catch {
        art.crew[mate.id] = mate.src;
      }
    }
    art.fruits = [];
    for (const src of FRUIT_SRC) {
      try {
        art.fruits.push(cropOpaque(await chroma(src)).toDataURL("image/png"));
      } catch {
        art.fruits.push(src);
      }
    }
    loaded = true;
  }

  function openCampaign(opts = {}) {
    open = true;
    store = loadStore();
    nameEl.value = store.name;
    syncWidgetUI();
    selected = Math.min(store.unlocked, LEVELS.length);
    root.classList.add("on");
    setBiome("menu");
    renderIslands();
    showScreen(opts.screen || "splash");
    api.setClickThrough(false);
    api.setFocusable(true);
    sounds.unlock();
    sounds.pop();
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(tick);
    preload().then(() => {
      if (open) renderIslands();
    });
    Object.values(WEATHER).forEach((spec) => {
      const img = new Image();
      img.src = spec.bg;
    });
  }

  function closeCampaign(silent) {
    open = false;
    run = null;
    root.classList.remove("on");
    showScreen("splash");
    cancelAnimationFrame(raf);
    if (!silent && onExit) onExit();
  }

  document.getElementById("btnSail").addEventListener("click", () => {
    persistName();
    run = { keepScore: false, score: 0 };
    startLevel(selected);
  });
  document.getElementById("btnRecords").addEventListener("click", () => {
    persistName();
    renderWanted();
    showScreen("board");
    sounds.stamp();
  });
  document.getElementById("btnCampBack").addEventListener("click", () => {
    setBiome("menu");
    showScreen("splash");
  });
  if (pickWidgetOn) {
    pickWidgetOn.addEventListener("click", async () => {
      const ok = await setWidget(true);
      if (ok && store.widget) {
        closeCampaign(true);
        if (onParkDesktop) onParkDesktop();
      }
    });
  }
  if (pickWidgetOff) {
    pickWidgetOff.addEventListener("click", async () => {
      await setWidget(false);
      closeCampaign(true);
      if (onParkDesktop) onParkDesktop();
    });
  }
  document.getElementById("btnHomeStart").addEventListener("click", () => {
    persistName();
    renderIslands();
    setBiome("menu");
    showScreen("menu");
    sounds.pop();
  });
  document.getElementById("btnBoardBack").addEventListener("click", () => {
    renderIslands();
    setBiome("menu");
    showScreen("menu");
  });
  btnNext.addEventListener("click", () => {
    if (!run) return;
    const next = run.level.n + 1;
    run.keepScore = true;
    startLevel(next);
  });
  btnRetry.addEventListener("click", () => {
    const n = run ? run.level.n : selected;
    run = { keepScore: false, score: 0 };
    startLevel(n);
  });
  document.getElementById("btnToMenu").addEventListener("click", () => {
    commitRecord(false);
    renderIslands();
    renderWanted();
    setBiome("menu");
    showScreen("menu");
  });
  nameEl.addEventListener("change", persistName);
  syncWidgetUI();

  addEventListener("resize", () => {
    if (open && screen === "playing") resizeFx();
  });

  return {
    open: openCampaign,
    close: closeCampaign,
    isOpen: () => open,
    handleEscape() {
      if (!open) return;
      if (screen === "playing" || screen === "over") commitRecord(false);
      if (screen === "playing") {
        run.attacks.forEach((a) => { a.alive = false; });
      }
      if (screen === "board" || screen === "intro" || screen === "over" || screen === "playing") {
        renderIslands();
        setBiome("menu");
        showScreen("menu");
        return;
      }
      if (screen === "menu") {
        setBiome("menu");
        showScreen("splash");
        return;
      }
      if (!store.widget) return;
      closeCampaign();
    },
    widgetOn: () => store.widget === true,
    syncInstalled(on) {
      store.widget = Boolean(on);
      saveStore(store);
      syncWidgetUI();
    },
  };
}
