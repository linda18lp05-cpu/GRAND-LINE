import { createSfx } from "./audio.js";
import { mountCampaign } from "./campaign.js?v=47";

const ROUND_S = 60;
const MAX_EATEN = 10;
const WIN_SAVED = 20;

const api = window.luffyDesk || {
  listDesktop: async () => [],
  stealFile: async () => ({ ok: false }),
  spitFiles: async () => [],
  setClickThrough() {},
  setFocusable() {},
  setLuffyVisible() {},
  onForceShow() {},
  onForceHide() {},
  onWidgetUninstalled() {},
};

const stage = document.getElementById("stage");
const filesEl = document.getElementById("files");
const speechEl = document.getElementById("speech");
const cloudEl = document.getElementById("cloud");
const callBtn = document.getElementById("callBtn");
const hudEl = document.getElementById("hud");
const timerEl = document.getElementById("timer");
const savedEl = document.getElementById("saved");
const eatenEl = document.getElementById("eaten");
const endEl = document.getElementById("endcard");
const endTitle = document.getElementById("endTitle");
const endSub = document.getElementById("endSub");
const flashEl = document.getElementById("flash");
const heroBox = document.getElementById("heroBox");
const hero = document.getElementById("hero");
const armCanvas = document.getElementById("armCanvas");
const armCtx = armCanvas.getContext("2d");
const fistL = document.getElementById("fistL");
const fistR = document.getElementById("fistR");
const iniziaBtn = document.getElementById("inizia");

const sfx = createSfx();
const campaign = mountCampaign({
  sfx,
  api,
  onWidgetChange: () => applyWidget(),
  onParkDesktop: () => parkOnDesktop(),
  onExit: () => {
    applyWidget();
    if (!campaign.widgetOn()) {
      openGrandLine();
      return;
    }
    if (state === "hidden") return;
    state = "idle";
    showMe();
    reply("Premi INIZIA sulla pancia!");
  },
});
const art = {};
const ATTACKS = [
  "Gomu Gomu no Pistol!",
  "Gomu Gomu no Gatling!",
  "Gomu Gomu no Bullet!",
  "Gomu Gomu no Whip!",
];
const FRUIT_SRC = [
  "assets/fruit-gomu.png",
  "assets/fruit-mera.png",
  "assets/fruit-hie.png",
  "assets/fruit-yami.png",
  "assets/fruit-goro.png",
  "assets/fruit-bara.png",
];

let state = "hidden";
let visible = false;
let hideTimer = null;
let files = [];
let saved = 0;
let eaten = 0;
let timeLeft = ROUND_S;
let bothArms = false;
let endLock = false;
let pose = "idle";
let nextAttack = 1.1;
let last = performance.now();

const arms = {
  left: { phase: "idle", t: 0, dur: 1.4, targetId: null },
  right: { phase: "idle", t: 0, dur: 1.4, targetId: null },
};

function chroma(src, mode) {
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
        const neon = g > 180 && r < 90 && b < 90 && greenLead > 80;
        const spillShadow = mode === "hat" && greenLead > 18 && r < 95 && b < 95 && g > 20;
        if (neon || spillShadow) {
          px[i + 3] = 0;
        } else if (mode === "hat" && g > r + 8 && g > b + 8) {
          px[i] = Math.min(255, r + 18);
          px[i + 1] = Math.max(0, g - 28);
        }
      }
      ctx.putImageData(data, 0, 0);
      resolve(c);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function drawPose(name) {
  const src = art[name] || art.idle;
  if (!src) return;
  hero.width = src.width;
  hero.height = src.height;
  const ctx = hero.getContext("2d");
  ctx.clearRect(0, 0, hero.width, hero.height);
  ctx.drawImage(src, 0, 0);
  pose = name;
  heroBox.classList.toggle("rage", name === "rage");
  heroBox.classList.toggle("gear", name === "gear5");
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

function splitArm(full) {
  const cut = Math.floor(full.width * 0.72);
  const shaft = document.createElement("canvas");
  shaft.width = cut;
  shaft.height = full.height;
  shaft.getContext("2d").drawImage(full, 0, 0, cut, full.height, 0, 0, cut, full.height);
  const fistRaw = document.createElement("canvas");
  fistRaw.width = full.width - cut;
  fistRaw.height = full.height;
  fistRaw.getContext("2d").drawImage(full, cut, 0, fistRaw.width, full.height, 0, 0, fistRaw.width, full.height);
  return { shaft: cropOpaque(shaft), fist: cropOpaque(fistRaw) };
}

function say(text) {
  speechEl.textContent = text;
  if (!cloudEl) return;
  cloudEl.classList.remove("pop");
  void cloudEl.offsetWidth;
  cloudEl.classList.add("pop");
}

function shout(text) {
  say(text);
}

function reply(text) {
  say(text);
}

function scheduleHide(ms) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (state === "idle") hideMe();
  }, ms);
}

function showMe() {
  visible = true;
  if (state === "hidden") state = "idle";
  stage.classList.add("show");
  api.setFocusable(true);
  api.setLuffyVisible(true);
  sfx.unlock();
  sfx.pop();
  drawPose("idle");
  if (state === "idle") scheduleHide(24000);
}

function hideMe() {
  if (campaign.isOpen()) campaign.close(true);
  visible = false;
  state = "hidden";
  stage.classList.remove("show", "playing", "ending");
  spitBack();
  filesEl.innerHTML = "";
  hudEl.classList.remove("on");
  endEl.classList.remove("on");
  clearArms();
  api.setClickThrough(true);
  api.setFocusable(false);
  api.setLuffyVisible(false);
  if (!campaign.widgetOn()) openGrandLine();
}

function applyWidget() {
  const on = campaign.widgetOn();
  document.body.classList.toggle("widget-off", !on);
  callBtn.hidden = !on;
}

function parkOnDesktop() {
  visible = false;
  state = "hidden";
  stage.classList.remove("show", "playing", "ending");
  hudEl.classList.remove("on");
  endEl.classList.remove("on");
  filesEl.innerHTML = "";
  clearArms();
  applyWidget();
  api.setClickThrough(true);
  api.setFocusable(false);
  api.setLuffyVisible(false);
}

function resetArms() {
  for (const a of Object.values(arms)) {
    a.phase = "idle";
    a.t = 0;
    a.targetId = null;
  }
  clearArms();
}

function clearArms() {
  armCanvas.width = innerWidth;
  armCanvas.height = innerHeight;
  armCtx.clearRect(0, 0, armCanvas.width, armCanvas.height);
  fistL.classList.remove("show");
  fistR.classList.remove("show");
}

function fileEl(id) {
  return document.querySelector(`[data-fid="${id}"]`);
}

function fileCenter(id) {
  const el = fileEl(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
}

function shoulder(side) {
  const r = hero.getBoundingClientRect();
  return {
    x: r.left + r.width * (side === "left" ? 0.28 : 0.72),
    y: r.top + r.height * 0.34,
  };
}

function fruitBtn(item) {
  const el = document.createElement("button");
  el.className = "fruit";
  el.type = "button";
  el.dataset.hit = "1";
  el.dataset.fid = item.uid;
  el.style.left = item.x + "px";
  el.style.top = item.y + "px";
  const img = document.createElement("img");
  img.alt = "";
  img.src = item.src;
  el.appendChild(img);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onFileClick(item.uid);
  });
  return el;
}

function scatterFruits(count) {
  const w = innerWidth;
  const h = innerHeight;
  const size = 88;
  const srcs = art.fruits.length ? art.fruits : FRUIT_SRC;
  const placed = [];
  let guard = 0;
  while (placed.length < count && guard++ < 900) {
    const x = 18 + Math.random() * Math.max(40, w - size - 36);
    const y = 78 + Math.random() * Math.max(40, h - size - 96);
    if (x > w - 320 && y > h - 290) continue;
    if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < 82)) continue;
    placed.push({
      uid: "d" + placed.length,
      x,
      y,
      src: srcs[placed.length % srcs.length],
      eaten: false,
    });
  }
  return placed;
}

function renderFiles() {
  filesEl.innerHTML = "";
  files.forEach((f) => {
    if (f.eaten) return;
    filesEl.appendChild(fruitBtn(f));
  });
}

function cancelArmFor(id) {
  for (const a of Object.values(arms)) {
    if (a.targetId === id && a.phase !== "idle") {
      a.phase = "recoil";
      a.t = 0;
      a.dur = 0.28;
    }
  }
}

function onFileClick(id) {
  if (state !== "playing") return;
  const f = files.find((x) => x.uid === id);
  if (!f || f.eaten) return;
  cancelArmFor(id);
  saved += 1;
  const el = fileEl(id);
  if (el) {
    el.classList.add("saved");
    el.classList.remove("danger");
    setTimeout(() => el.classList.remove("saved"), 350);
  }
  sfx.slap();
  updateHud();
  if (saved >= WIN_SAVED) finish("player");
}

function pickTarget(except) {
  const live = files.filter((f) => !f.eaten && f.uid !== except);
  if (!live.length) return null;
  return live[Math.floor(Math.random() * live.length)].uid;
}

function launchArm(side) {
  const arm = arms[side];
  if (arm.phase !== "idle") return;
  const other = side === "left" ? arms.right : arms.left;
  const id = pickTarget(other.targetId);
  if (!id) return;
  arm.phase = "stretch";
  arm.t = 0;
  arm.dur = Math.max(0.75, 1.6 - eaten * 0.12);
  arm.targetId = id;
  sfx.woosh();
  shout(ATTACKS[Math.floor(Math.random() * ATTACKS.length)]);
  const el = fileEl(id);
  if (el) el.classList.add("danger");
}

async function eatFile(id) {
  const f = files.find((x) => x.uid === id);
  if (!f || f.eaten) return;
  f.eaten = true;
  eaten += 1;
  const el = fileEl(id);
  if (el) {
    const box = hero.getBoundingClientRect();
    const mouth = {
      x: box.left + box.width * 0.52,
      y: box.top + box.height * 0.22,
    };
    const r = el.getBoundingClientRect();
    el.style.left = r.left + r.width / 2 + "px";
    el.style.top = r.top + "px";
    el.style.position = "fixed";
    el.style.setProperty("--mx", mouth.x + "px");
    el.style.setProperty("--my", mouth.y + "px");
    el.classList.add("eaten");
    setTimeout(() => el.remove(), 380);
  }
  sfx.chomp();
  shout(eaten >= MAX_EATEN ? "Umpf! Che buono! Adesso... Gear Fifth!" : "Umpf! Frutto del diavolo!");
  updateHud();
  if (eaten >= MAX_EATEN) finish("luffy");
}

async function spitBack() {
  let restored = [];
  try {
    restored = (await api.spitFiles()) || [];
  } catch (_) {
    restored = [];
  }
  if (!restored.length) return;
  sfx.pop();
}

function updateHud() {
  const m = Math.floor(timeLeft / 60);
  const s = Math.floor(timeLeft % 60).toString().padStart(2, "0");
  timerEl.textContent = m + ":" + s;
  savedEl.textContent = saved + "/" + WIN_SAVED;
  eatenEl.textContent = eaten + "/" + MAX_EATEN;
}

function rubberTip(a, b, k) {
  const t = 1 - Math.pow(1 - k, 2);
  const end = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  const ctrl = {
    x: (a.x + end.x) / 2,
    y: (a.y + end.y) / 2 + Math.sin(t * Math.PI) * 34,
  };
  return { end, ctrl, t };
}

function bezier(a, c, b, t) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

function sampleSkin(src) {
  const w = src.width;
  const h = src.height;
  const data = src.getContext("2d").getImageData(0, 0, w, h).data;
  let r = 0, g = 0, b = 0, n = 0;
  const y0 = Math.floor(h * 0.35);
  const y1 = Math.floor(h * 0.65);
  const x0 = Math.floor(w * 0.2);
  const x1 = Math.floor(w * 0.8);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 180) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  if (!n) return { fill: "#e39b6a", edge: "#b56a3e", lite: "#f3c49a" };
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  return {
    fill: `rgb(${r},${g},${b})`,
    edge: `rgb(${Math.max(0, r - 48)},${Math.max(0, g - 55)},${Math.max(0, b - 48)})`,
    lite: `rgb(${Math.min(255, r + 38)},${Math.min(255, g + 32)},${Math.min(255, b + 24)})`,
  };
}

function armAngle(from, ctrl, end, t) {
  const d = 0.02;
  const a = bezier(from, ctrl, end, Math.max(0, t - d));
  const b = bezier(from, ctrl, end, Math.min(1, t + d));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function drawTexturedArm(from, dest, k) {
  if (!art.fist) return dest;
  const { end, ctrl } = rubberTip(from, dest, k);
  const steps = 36;
  const skin = art.skin || { fill: "#e39b6a", edge: "#b56a3e", lite: "#f3c49a" };
  const pts = [];
  const wristT = 0.84;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * wristT;
    const p = bezier(from, ctrl, end, t);
    const ang = armAngle(from, ctrl, end, t);
    const w = 28 - 10 * (t / wristT);
    pts.push({ x: p.x, y: p.y, ang, w });
  }
  const wrist = pts[pts.length - 1];
  const tip = bezier(from, ctrl, end, 1);

  armCtx.save();
  armCtx.imageSmoothingEnabled = true;
  armCtx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const nx = Math.cos(pts[i].ang + Math.PI / 2);
    const ny = Math.sin(pts[i].ang + Math.PI / 2);
    const x = pts[i].x + nx * pts[i].w / 2;
    const y = pts[i].y + ny * pts[i].w / 2;
    if (i === 0) armCtx.moveTo(x, y);
    else armCtx.lineTo(x, y);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const nx = Math.cos(pts[i].ang + Math.PI / 2);
    const ny = Math.sin(pts[i].ang + Math.PI / 2);
    armCtx.lineTo(pts[i].x - nx * pts[i].w / 2, pts[i].y - ny * pts[i].w / 2);
  }
  armCtx.closePath();
  armCtx.shadowColor = "rgba(0,0,0,.28)";
  armCtx.shadowBlur = 8;
  armCtx.shadowOffsetY = 5;
  armCtx.fillStyle = skin.fill;
  armCtx.fill();
  armCtx.beginPath();
  armCtx.arc(pts[0].x, pts[0].y, pts[0].w / 2, 0, Math.PI * 2);
  armCtx.arc(wrist.x, wrist.y, wrist.w / 2, 0, Math.PI * 2);
  armCtx.fill();
  armCtx.shadowColor = "transparent";
  armCtx.lineJoin = "round";
  armCtx.lineCap = "round";
  armCtx.strokeStyle = skin.edge;
  armCtx.lineWidth = 2.2;
  armCtx.stroke();

  armCtx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const nx = Math.cos(pts[i].ang + Math.PI / 2);
    const ny = Math.sin(pts[i].ang + Math.PI / 2);
    const x = pts[i].x - nx * pts[i].w * 0.22;
    const y = pts[i].y - ny * pts[i].w * 0.22;
    if (i === 0) armCtx.moveTo(x, y);
    else armCtx.lineTo(x, y);
  }
  armCtx.strokeStyle = skin.lite;
  armCtx.globalAlpha = 0.45;
  armCtx.lineWidth = 5;
  armCtx.stroke();
  armCtx.globalAlpha = 1;

  const fh = Math.max(42, wrist.w * 2.4);
  const fw = (art.fist.width / Math.max(1, art.fist.height)) * fh;
  armCtx.translate(wrist.x, wrist.y);
  armCtx.rotate(wrist.ang);
  armCtx.drawImage(art.fist, -fw * 0.18, -fh / 2, fw, fh);
  armCtx.restore();
  return tip;
}

function drawArms() {
  armCanvas.width = innerWidth;
  armCanvas.height = innerHeight;
  armCtx.clearRect(0, 0, armCanvas.width, armCanvas.height);
  for (const side of ["left", "right"]) {
    const arm = arms[side];
    const fist = side === "left" ? fistL : fistR;
    if (arm.phase === "idle" || !arm.targetId) {
      fist.classList.remove("show");
      continue;
    }
    const from = shoulder(side);
    const dest = fileCenter(arm.targetId) || from;
    let k = arm.phase === "recoil" ? Math.max(0, 1 - arm.t / arm.dur) : Math.min(1, arm.t / arm.dur);
    const tip = drawTexturedArm(from, dest, k);
    fist.style.left = tip.x + "px";
    fist.style.top = tip.y + "px";
    fist.classList.add("show");
    fist.dataset.hit = "1";
    fist.dataset.side = side;
  }
}

function startGame() {
  if (state === "playing" || endLock) return;
  if (campaign.isOpen()) campaign.close(true);
  sfx.start();
  state = "playing";
  stage.classList.add("playing");
  hudEl.classList.add("on");
  endEl.classList.remove("on");
  saved = 0;
  eaten = 0;
  timeLeft = ROUND_S;
  bothArms = false;
  resetArms();
  drawPose("idle");
  files = scatterFruits(32);
  renderFiles();
  updateHud();
  say("Che fame! Quei frutti del diavolo sono miei!");
  clearTimeout(hideTimer);
}

function finish(winner) {
  if (state !== "playing") return;
  state = winner === "player" ? "win_player" : "win_luffy";
  stage.classList.remove("playing");
  stage.classList.add("ending");
  hudEl.classList.remove("on");
  filesEl.querySelectorAll(".danger").forEach((el) => el.classList.remove("danger"));
  resetArms();
  endLock = true;
  if (winner === "player") {
    drawPose("rage");
    sfx.scream();
    reply("NOOOO! I miei file!");
    endTitle.textContent = "HAI VINTO";
    endSub.textContent = "Hai salvato 20 frutti del diavolo! Luffy si infuria.";
  } else {
    flashEl.classList.add("on");
    sfx.gear();
    drawPose("gear5");
    reply("Gear Fifth! Eh eh eh!");
    endTitle.textContent = "GEAR FIFTH";
    endSub.textContent = "Luffy ha mangiato 10 frutti del diavolo e passa a Gear Fifth!";
    setTimeout(() => flashEl.classList.remove("on"), 700);
  }
  spitBack();
  endEl.classList.add("on");
  setTimeout(() => { endLock = false; }, 1200);
}

function onFistClick(side) {
  if (state !== "playing") return;
  const arm = arms[side];
  if (arm.phase !== "stretch") return;
  arm.phase = "recoil";
  arm.t = 0;
  arm.dur = 0.28;
  saved += 1;
  sfx.slap();
  const el = fileEl(arm.targetId);
  if (el) el.classList.remove("danger");
  shout("Ah! Che fastidio! Resta fermo!");
  updateHud();
  if (saved >= WIN_SAVED) finish("player");
}

iniziaBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sfx.unlock();
  if (state === "hidden") showMe();
  startGame();
});
fistL.addEventListener("click", () => onFistClick("left"));
fistR.addEventListener("click", () => onFistClick("right"));
document.getElementById("btnAgain").addEventListener("click", () => {
  endLock = false;
  endEl.classList.remove("on");
  stage.classList.remove("ending");
  state = "idle";
  startGame();
});
document.getElementById("btnBye").addEventListener("click", hideMe);

document.addEventListener("mousemove", (e) => {
  const onCall = Boolean(e.target.closest("#callBtn"));
  if (campaign.isOpen()) {
    api.setClickThrough(false);
    return;
  }
  if (!visible) {
    api.setClickThrough(!onCall);
    return;
  }
  const hit = e.target.closest("[data-hit], #inizia, .fist.show, canvas, #callBtn");
  const box = hero.getBoundingClientRect();
  const onHero = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
  api.setClickThrough(!(hit || onHero || onCall));
});

hero.addEventListener("click", (e) => {
  if (state !== "idle" && state !== "hidden") return;
  const r = hero.getBoundingClientRect();
  const y = (e.clientY - r.top) / r.height;
  if (y > 0.42 && y < 0.72) {
    if (state === "hidden") showMe();
    startGame();
  }
});

callBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sfx.unlock();
  showMe();
  if (state === "idle") reply("Premi INIZIA sulla pancia!");
});

api.onForceShow(() => {
  showMe();
  if (state === "idle") reply("Premi INIZIA sulla pancia!");
});

api.onForceHide(() => {
  if (visible) hideMe();
});

if (typeof api.onWidgetUninstalled === "function") {
  api.onWidgetUninstalled(() => {
    campaign.syncInstalled(false);
    applyWidget();
    if (campaign.isOpen()) campaign.close(true);
  });
}

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  e.preventDefault();
  if (campaign.isOpen()) {
    campaign.handleEscape();
    return;
  }
  if (visible) hideMe();
});

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (visible && state === "playing") {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      finish(saved >= WIN_SAVED ? "player" : "luffy");
    }
    if (!bothArms && ROUND_S - timeLeft > 18) bothArms = true;
    nextAttack -= dt;
    if (nextAttack <= 0 && state === "playing") {
      if (arms.right.phase === "idle") launchArm("right");
      else if (bothArms && arms.left.phase === "idle") launchArm("left");
      nextAttack = Math.max(0.55, 1.65 - eaten * 0.18);
    }
    for (const side of ["left", "right"]) {
      const arm = arms[side];
      if (arm.phase === "stretch") {
        arm.t += dt;
        if (!fileEl(arm.targetId)) {
          arm.phase = "recoil";
          arm.t = 0;
          arm.dur = 0.25;
        } else if (arm.t >= arm.dur) {
          const el = fileEl(arm.targetId);
          if (el) el.classList.remove("danger");
          eatFile(arm.targetId);
          arm.phase = "recoil";
          arm.t = 0;
          arm.dur = 0.22;
        }
      } else if (arm.phase === "recoil") {
        arm.t += dt;
        if (arm.t >= arm.dur) {
          arm.phase = "idle";
          arm.targetId = null;
        }
      }
    }
    drawArms();
    updateHud();
  }
  requestAnimationFrame(tick);
}

async function boot() {
  art.idle = cropOpaque(await chroma("assets/luffy-idle.png"));
  art.rage = cropOpaque(await chroma("assets/luffy-rage.png"));
  art.gear5 = cropOpaque(await chroma("assets/luffy-gear5.png"));
  try {
    const rawArm = cropOpaque(await chroma("assets/luffy-arm-real.png"));
    const parts = splitArm(rawArm);
    art.shaft = parts.shaft;
    art.fist = parts.fist;
    art.skin = sampleSkin(parts.shaft);
  } catch (_) {
    try {
      const rawArm = cropOpaque(await chroma("assets/luffy-arm.png"));
      const parts = splitArm(rawArm);
      art.shaft = parts.shaft;
      art.fist = parts.fist;
      art.skin = sampleSkin(parts.shaft);
    } catch (__) {}
  }
  art.fruits = [];
  for (const src of FRUIT_SRC) {
    try {
      art.fruits.push(cropOpaque(await chroma(src)).toDataURL("image/png"));
    } catch (_) {}
  }
  try {
    const hat = cropOpaque(await chroma("assets/luffy-hat.png", "hat"));
    const hatImg = document.getElementById("callHat");
    if (hatImg) hatImg.src = hat.toDataURL("image/png");
  } catch (_) {}
  drawPose("idle");
  requestAnimationFrame(tick);
  if (window.luffyDesk && typeof api.widgetStatus === "function") {
    try {
      const st = await api.widgetStatus();
      campaign.syncInstalled(Boolean(st && st.installed));
    } catch (_) {
      campaign.syncInstalled(false);
    }
  }
  applyWidget();
  if (!window.luffyDesk) {
    document.body.style.background = "linear-gradient(#7ec8f5 0%, #1d7ab5 55%, #0b4d78 100%)";
    openGrandLine();
    return;
  }
  if (campaign.widgetOn()) parkOnDesktop();
  else openGrandLine();
}

function openGrandLine(screen) {
  if (state === "playing") return;
  sfx.unlock();
  visible = true;
  state = "idle";
  stage.classList.remove("show", "playing", "ending");
  hudEl.classList.remove("on");
  endEl.classList.remove("on");
  filesEl.innerHTML = "";
  clearArms();
  api.setClickThrough(false);
  api.setFocusable(true);
  api.setLuffyVisible(true);
  clearTimeout(hideTimer);
  campaign.open({ screen: screen || "splash" });
}

boot();
addEventListener("beforeunload", () => {
  api.spitFiles();
});
