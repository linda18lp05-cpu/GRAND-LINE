const fs = require("fs");
const path = require("path");
const { synthesize } = require("./tts");

const LINES = {
  hello: "Eh eh eh eh! Sono Monkey D. Luffy! Premi INIZIA sulla pancia, dai!",
  call: "Ehi! Sono Luffy! Premi INIZIA sulla pancia e facciamo a botte!",
  hunger: "Premi INIZIA sulla pancia! Poi non farmi mangiare i file, ho una fame!",
  start: "Che fame! Gomu Gomu no Banquet! Quei file sono miei!",
  pistol: "Gomu Gomu no Pistol!",
  gatling: "Gomu Gomu no Gatling!",
  bullet: "Gomu Gomu no Bullet!",
  whip: "Gomu Gomu no Whip!",
  yum: "Umpf! Carneee! Ancora!",
  gear: "Umpf! Che buono! Adesso... Gear Fifth!",
  slap: "Ah! Che fastidio! Resta fermo!",
  rage: "NOOOO! I miei file! Ho una fame da lupi!",
  spit: "Gear Fifth! Eh eh eh! Va bene, ti risputo tutto!",
  bye: "Eh eh eh! Ci si rivede! Io sarò il re dei pirati!",
  empty: "Non vedo file sulla tua Scrivania! Metti qualcosa sul desktop e richiamami!",
};

async function run() {
  const dir = path.join(__dirname, "assets", "voice");
  fs.mkdirSync(dir, { recursive: true });
  for (const [key, text] of Object.entries(LINES)) {
    process.stdout.write(key + "... ");
    const b64 = await synthesize(text);
    if (!b64) throw new Error("failed " + key);
    fs.writeFileSync(path.join(dir, key + ".mp3"), Buffer.from(b64, "base64"));
    console.log("ok");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
