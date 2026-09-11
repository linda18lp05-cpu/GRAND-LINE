const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROME = "143.0.3650.75";
const VOICES = ["it-IT-GiuseppeNeural", "it-IT-DiegoNeural"];
const CACHE_DIR = path.join(__dirname, "voice-cache");
const cache = new Map();

function uuid() {
  return crypto.randomBytes(16).toString("hex");
}

function gec() {
  const WIN_EPOCH = 11644473600;
  let ticks = Date.now() / 1000 + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks = Math.floor(ticks * 10_000_000);
  return crypto.createHash("sha256").update(`${ticks}${TOKEN}`).digest("hex").toUpperCase();
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itaLine(text) {
  return String(text)
    .replace(/Shishishi!?/gi, "Eh eh eh eh!")
    .replace(/Sci sci sci!?/gi, "Eh eh eh eh!")
    .replace(/\bnakama\b/gi, "amico")
    .replace(/…/g, "! ");
}

function ssml(text, voice) {
  const line = escapeXml(itaLine(text));
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='it-IT'>` +
    `<voice name='${voice}'>` +
    `<prosody rate='+8%' pitch='+16%' volume='x-loud'>${line}</prosody>` +
    `</voice></speak>`
  );
}

function parseBin(buf) {
  if (buf.length < 2) return null;
  const headerLen = buf.readUInt16BE(0);
  if (headerLen < 0 || 2 + headerLen > buf.length) return null;
  const header = buf.slice(2, 2 + headerLen).toString("utf8");
  const body = buf.slice(2 + headerLen);
  return { header, body };
}

function edgeSpeak(text, voice) {
  const id = uuid();
  const url =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TOKEN}` +
    `&ConnectionId=${id}` +
    `&Sec-MS-GEC=${gec()}` +
    `&Sec-MS-GEC-Version=1-${CHROME}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent":
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0`,
      },
    });
    const chunks = [];
    const timer = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      reject(new Error("timeout"));
    }, 12000);

    ws.on("error", () => {
      clearTimeout(timer);
      reject(new Error("socket"));
    });
    ws.on("open", () => {
      ws.send(
        `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`
      );
      ws.send(
        `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n` +
          ssml(text, voice)
      );
    });
    ws.on("message", (data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const asText = buf.toString("utf8");
      if (asText.includes("Path:turn.end") && !asText.includes("Path:audio")) {
        clearTimeout(timer);
        ws.close();
        resolve(Buffer.concat(chunks));
        return;
      }
      if (asText.startsWith("X-RequestId:") || asText.includes("Path:response") || asText.includes("Path:turn.")) {
        return;
      }
      const parsed = parseBin(buf);
      if (parsed && /Path:audio/i.test(parsed.header) && parsed.body.length) {
        chunks.push(parsed.body);
      }
    });
  });
}

function cachePath(line) {
  const key = crypto.createHash("sha1").update(line).digest("hex");
  return path.join(CACHE_DIR, key + ".mp3");
}

function readCache(line) {
  if (cache.has(line)) return cache.get(line);
  try {
    const file = cachePath(line);
    if (fs.existsSync(file)) {
      const b64 = fs.readFileSync(file).toString("base64");
      cache.set(line, b64);
      return b64;
    }
  } catch (_) {}
  return null;
}

function writeCache(line, buf) {
  const b64 = buf.toString("base64");
  cache.set(line, b64);
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath(line), buf);
  } catch (_) {}
  return b64;
}

async function synthesize(text) {
  const line = itaLine(text).trim();
  if (!line) return null;
  const hit = readCache(line);
  if (hit) return hit;
  let buf = null;
  for (const voice of VOICES) {
    try {
      buf = await edgeSpeak(line, voice);
      if (buf && buf.length > 200) break;
    } catch (err) {
      console.error("[luffy-tts]", voice, err.message);
      buf = null;
    }
  }
  if (!buf || buf.length < 200) return null;
  return writeCache(line, buf);
}

const WARM_LINES = [
  "Eh eh eh eh! Sono Monkey D. Luffy! Premi INIZIA sulla pancia, dai!",
  "Ehi! Sono Luffy! Premi INIZIA sulla pancia e facciamo a botte!",
  "Premi INIZIA sulla pancia! Poi non farmi mangiare i file, ho una fame!",
  "Che fame! Gomu Gomu no Banquet! Quei file sono miei!",
  "Gomu Gomu no Pistol!",
  "Gomu Gomu no Gatling!",
  "Gomu Gomu no Bullet!",
  "Gomu Gomu no Whip!",
  "Umpf! Carneee! Ancora!",
  "Umpf! Che buono! Adesso... Gear Fifth!",
  "Ah! Che fastidio! Resta fermo!",
  "NOOOO! I MIEI FILE! Ho una fame da lupi! Pffft, riprenditeli!",
  "Gear Fifth! Eh eh eh! Va bene, ti risputo tutto!",
  "Eh eh eh! Ci si rivede! Io sarò il re dei pirati!",
];

async function warmup() {
  for (const line of WARM_LINES) {
    try {
      await synthesize(line);
    } catch (_) {}
  }
}

module.exports = { synthesize, itaLine, warmup };
