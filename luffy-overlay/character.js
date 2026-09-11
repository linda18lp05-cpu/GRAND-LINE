import * as THREE from "./node_modules/three/build/three.module.js";

function makeRamp() {
  const data = new Uint8Array([
    72, 72, 72, 255,
    130, 130, 130, 255,
    188, 188, 188, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 4, 1);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

const RAMP = makeRamp();

function toon(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: RAMP, ...extra });
}

function outline(mesh, grow = 1.07, color = 0x1a0c08) {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const o = new THREE.Mesh(mesh.geometry, mat);
  o.scale.setScalar(grow);
  mesh.add(o);
  return o;
}

function bellyMap() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(256, 220, 30, 256, 256, 260);
  grd.addColorStop(0, "#f8d0b0");
  grd.addColorStop(1, "#e09a68");
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#fff6ea";
  g.lineWidth = 18;
  g.beginPath();
  if (g.roundRect) g.roundRect(70, 190, 372, 150, 28);
  else g.rect(70, 190, 372, 150);
  g.fillStyle = "#c62828";
  g.fill();
  g.stroke();
  g.fillStyle = "#fff8ee";
  g.font = "900 92px Impact, Arial Black, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("INIZIA", 256, 270);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function rubberArm() {
  const geo = new THREE.CylinderGeometry(0.16, 0.13, 1, 16, 8);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, -0.5);
  return geo;
}

export function createLuffy() {
  const group = new THREE.Group();
  const skin = toon(0xf3c39a);
  const skinDark = toon(0xe09a68);
  const hair = toon(0x1a120c);
  const hairWhite = toon(0xf4f1ea);
  const hat = toon(0xe8c56b);
  const hatDark = toon(0xc9a227);
  const band = toon(0xc62828);
  const vest = toon(0xd32f2f);
  const shorts = toon(0x1e4d8c);
  const sash = toon(0xe6c35c);
  const sandal = toon(0x6d4c2a);
  const black = toon(0x1a120c);
  const white = toon(0xfff8f0);
  const scar = toon(0xb56b4a);

  const body = new THREE.Group();
  group.add(body);

  const hips = new THREE.Group();
  hips.position.y = 0.95;
  body.add(hips);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), skin);
  pelvis.scale.set(1.15, 0.7, 1);
  hips.add(pelvis);

  const shortsM = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.42, 16), shorts);
  shortsM.position.y = -0.12;
  hips.add(shortsM);
  outline(shortsM, 1.06);

  const sashM = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 10, 24), sash);
  sashM.rotation.x = Math.PI / 2;
  sashM.position.y = 0.12;
  hips.add(sashM);
  const sashKnot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), sash);
  sashKnot.position.set(0.34, 0.08, 0.18);
  hips.add(sashKnot);

  function leg(side) {
    const g = new THREE.Group();
    g.position.set(side * 0.18, -0.28, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 10), skin);
    thigh.position.y = -0.28;
    g.add(thigh);
    outline(thigh, 1.08);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.38), sandal);
    foot.position.set(0, -0.58, 0.06);
    g.add(foot);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.08), toon(0x4a331c));
    strap.position.set(0, -0.52, 0.08);
    g.add(strap);
    hips.add(g);
    return g;
  }
  const leftLeg = leg(-1);
  const rightLeg = leg(1);

  const torso = new THREE.Group();
  torso.position.y = 0.38;
  hips.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), skin);
  chest.scale.set(1.05, 1.15, 0.9);
  chest.position.y = 0.28;
  torso.add(chest);
  outline(chest, 1.05);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 18), skinDark);
  belly.scale.set(1.15, 0.95, 1);
  belly.position.set(0, -0.02, 0.06);
  torso.add(belly);
  outline(belly, 1.04);

  const startBtn = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 32),
    new THREE.MeshToonMaterial({ map: bellyMap(), gradientMap: RAMP })
  );
  startBtn.position.set(0, 0.02, 0.44);
  startBtn.name = "belly";
  torso.add(startBtn);
  const bellyHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 10, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bellyHit.position.set(0, 0.02, 0.28);
  bellyHit.name = "belly";
  torso.add(bellyHit);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.46, 28),
    new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  glow.position.copy(startBtn.position);
  glow.position.z += 0.01;
  torso.add(glow);

  const scar1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.04), scar);
  scar1.position.set(0.02, 0.38, 0.36);
  scar1.rotation.z = 0.55;
  torso.add(scar1);
  const scar2 = scar1.clone();
  scar2.rotation.z = -0.55;
  torso.add(scar2);

  function vestFlap(side) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.08), vest);
    f.position.set(side * 0.38, 0.18, 0.08);
    f.rotation.y = side * -0.55;
    f.rotation.z = side * 0.08;
    torso.add(f);
    outline(f, 1.04);
    return f;
  }
  const vestL = vestFlap(-1);
  const vestR = vestFlap(1);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.16, 12), skin);
  neck.position.y = 0.78;
  torso.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.18;
  torso.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 22), skin);
  skull.scale.set(1, 1.02, 0.95);
  head.add(skull);
  outline(skull, 1.045);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
  earL.position.set(-0.48, -0.02, 0);
  head.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.48;
  head.add(earR);

  function eye(side) {
    const g = new THREE.Group();
    g.position.set(side * 0.18, 0.04, 0.4);
    const whiteM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), white);
    whiteM.scale.set(1, 1.15, 0.45);
    g.add(whiteM);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), black);
    iris.position.z = 0.05;
    iris.scale.set(0.85, 1, 0.5);
    g.add(iris);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(0.03, 0.04, 0.09);
    g.add(shine);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 8), skin);
    lid.scale.set(1, 0.01, 0.5);
    lid.position.y = 0.08;
    g.add(lid);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.05), hair);
    brow.position.set(0, 0.18, 0.02);
    g.add(brow);
    head.add(g);
    return { g, lid, brow, iris };
  }
  const eyeL = eye(-1);
  const eyeR = eye(1);

  const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.03), scar);
  stitch.position.set(-0.18, -0.1, 0.46);
  head.add(stitch);
  const stitch2 = stitch.clone();
  stitch2.scale.set(0.4, 1.6, 1);
  stitch2.position.y = -0.07;
  stitch2.rotation.z = Math.PI / 2;
  head.add(stitch2);
  const stitch3 = stitch2.clone();
  stitch3.position.y = -0.13;
  head.add(stitch3);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skinDark);
  nose.position.set(0, -0.04, 0.5);
  nose.scale.set(0.8, 0.7, 1);
  head.add(nose);

  const mouth = new THREE.Group();
  mouth.position.set(0, -0.22, 0.42);
  head.add(mouth);
  const grin = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 18, Math.PI), black);
  grin.rotation.x = Math.PI;
  grin.position.z = 0.04;
  mouth.add(grin);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.04), white);
  teeth.position.set(0, -0.02, 0.03);
  teeth.visible = false;
  mouth.add(teeth);
  const openMouth = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), black);
  openMouth.scale.set(1.1, 0.7, 0.45);
  openMouth.position.set(0, -0.06, 0.04);
  openMouth.visible = false;
  mouth.add(openMouth);

  const hairGroup = new THREE.Group();
  head.add(hairGroup);
  const spikes = [
    [0, 0.42, -0.1, 0.22, 0.28, 0.22],
    [-0.28, 0.32, 0.05, 0.18, 0.22, 0.18],
    [0.28, 0.32, 0.05, 0.18, 0.22, 0.18],
    [-0.38, 0.12, -0.08, 0.16, 0.2, 0.16],
    [0.38, 0.12, -0.08, 0.16, 0.2, 0.16],
    [-0.22, 0.28, 0.28, 0.14, 0.16, 0.14],
    [0.22, 0.28, 0.28, 0.14, 0.16, 0.14],
    [0, 0.22, -0.38, 0.2, 0.18, 0.2],
    [-0.15, 0.38, 0.18, 0.12, 0.16, 0.12],
    [0.15, 0.38, 0.18, 0.12, 0.16, 0.12],
  ];
  const blackHair = new THREE.Group();
  const whiteHairG = new THREE.Group();
  whiteHairG.visible = false;
  hairGroup.add(blackHair, whiteHairG);
  for (const [x, y, z, sx, sy, sz] of spikes) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), hair);
    b.position.set(x, y, z);
    b.scale.set(sx, sy, sz);
    blackHair.add(b);
    const w = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), hairWhite);
    w.position.set(x, y * 1.15, z);
    w.scale.set(sx * 1.25, sy * 1.35, sz * 1.25);
    whiteHairG.add(w);
  }

  const hatG = new THREE.Group();
  hatG.position.set(0, 0.42, -0.04);
  hatG.rotation.x = -0.18;
  hatG.rotation.z = -0.08;
  head.add(hatG);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.95, 0.07, 36), hat);
  brim.position.y = 0.02;
  hatG.add(brim);
  outline(brim, 1.02);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.42, 24), hatDark);
  crown.position.y = 0.24;
  hatG.add(crown);
  outline(crown, 1.03);
  const bandM = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 24), band);
  bandM.position.y = 0.08;
  hatG.add(bandM);

  const clouds = new THREE.Group();
  clouds.visible = false;
  body.add(clouds);
  for (let i = 0; i < 10; i++) {
    const cl = new THREE.Mesh(new THREE.SphereGeometry(0.22 + (i % 3) * 0.06, 12, 10), white);
    const a = (i / 10) * Math.PI * 2;
    cl.position.set(Math.cos(a) * 0.9, 1.1 + (i % 4) * 0.25, Math.sin(a) * 0.7);
    cl.userData.phase = i;
    clouds.add(cl);
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.48, 0.55, 0.02);
    torso.add(shoulder);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
    shoulder.add(cap);
    const arm = new THREE.Mesh(rubberArm(), skin);
    arm.name = side < 0 ? "armL" : "armR";
    shoulder.add(arm);
    outline(arm, 1.08);
    const hand = new THREE.Group();
    shoulder.add(hand);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), skin);
    hand.add(palm);
    outline(palm, 1.1);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.1, 3, 6), skin);
      f.position.set((i - 1.5) * 0.055, 0.02, -0.14);
      f.rotation.x = -0.5;
      hand.add(f);
    }
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.name = side < 0 ? "handL" : "handR";
    hand.add(hit);
    return { shoulder, arm, hand };
  }

  const left = makeArm(-1);
  const right = makeArm(1);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();

  let blinkT = 2.4;
  let expression = "grin";
  let mode = "normal";
  let inflate = 0;

  function aimArm(part, worldTarget, length) {
    part.shoulder.lookAt(worldTarget);
    const thin = Math.max(0.38, 1 / Math.sqrt(Math.max(0.4, length)));
    part.arm.scale.set(thin, thin, length);
    part.hand.position.set(0, 0, -length);
  }

  function hangArm(part, side, t) {
    part.shoulder.getWorldPosition(tmp);
    tmp2.set(side * 0.25, -1.35 + Math.sin(t * 2 + side) * 0.08, 0.12);
    tmp.add(tmp2);
    aimArm(part, tmp, 1.05 + Math.sin(t * 2 + side) * 0.04);
  }

  function setExpression(name) {
    expression = name;
    const angry = name === "angry" || name === "scream";
    const laugh = name === "laugh" || name === "eat";
    eyeL.brow.rotation.z = angry ? 0.45 : laugh ? -0.25 : 0.12;
    eyeR.brow.rotation.z = angry ? -0.45 : laugh ? 0.25 : -0.12;
    grin.visible = name !== "scream" && name !== "eat";
    openMouth.visible = name === "scream" || name === "eat" || name === "laugh";
    teeth.visible = name === "eat" || name === "laugh";
    openMouth.scale.set(name === "scream" ? 1.6 : 1.1, name === "scream" ? 1.2 : 0.7, 0.45);
  }

  function setMode(next) {
    mode = next;
    const g5 = next === "gear5";
    blackHair.visible = !g5;
    whiteHairG.visible = g5;
    clouds.visible = g5;
    vestL.visible = !g5;
    vestR.visible = !g5;
    shortsM.material = g5 ? white : shorts;
    skin.color.set(g5 ? 0xffe7d2 : 0xf3c39a);
    hatG.visible = !g5;
    if (g5) setExpression("laugh");
  }

  setExpression("grin");

  return {
    group,
    startBtn,
    bellyHit,
    glow,
    left,
    right,
    head,
    hatG,
    body,
    setExpression,
    setMode,
    getMode: () => mode,
    setInflate(v) {
      inflate = v;
    },
    worldHand(side, out = new THREE.Vector3()) {
      return (side < 0 ? left : right).hand.getWorldPosition(out);
    },
    worldMouth(out = new THREE.Vector3()) {
      return mouth.getWorldPosition(out);
    },
    update(t, dt, pose) {
      blinkT -= dt;
      const blinking = blinkT < 0.12;
      if (blinkT < 0) blinkT = 2.2 + Math.random() * 2.5;
      eyeL.lid.scale.y = blinking ? 0.9 : 0.01;
      eyeR.lid.scale.y = blinking ? 0.9 : 0.01;

      const bounce = Math.sin(t * 3.2) * 0.035;
      body.position.y = bounce;
      hatG.rotation.z = -0.08 + Math.sin(t * 2.4) * 0.04;
      hatG.rotation.x = -0.18 + Math.sin(t * 1.6) * 0.03;

      if (pose.look) group.rotation.y = pose.look;

      if (pose.leftTarget && pose.leftLength > 0.2) aimArm(left, pose.leftTarget, pose.leftLength);
      else hangArm(left, -1, t);
      if (pose.rightTarget && pose.rightLength > 0.2) aimArm(right, pose.rightTarget, pose.rightLength);
      else hangArm(right, 1, t);

      const inf = pose.inflate ?? inflate;
      inflate = inf;
      const rage = mode === "rage";
      const p = rage ? inf : 0;
      belly.scale.set(1.15 + p * 1.8, 0.95 + p * 1.6, 1 + p * 2.1);
      chest.scale.set(1.05 + p * 0.5, 1.15 + p * 0.4, 0.9 + p * 0.8);
      skull.scale.set(1 + p * 0.25, 1.02 + p * 0.2, 0.95 + p * 0.35);
      if (rage) {
        skin.color.setRGB(0.95, 0.35 + (1 - p) * 0.4, 0.32);
        startBtn.visible = false;
        glow.visible = false;
      }

      startBtn.visible = pose.showStart;
      glow.visible = pose.showStart;
      if (pose.showStart) {
        const s = 1 + Math.sin(t * 5) * 0.08;
        startBtn.scale.setScalar(s);
        glow.scale.setScalar(s);
        glow.material.opacity = 0.45 + Math.sin(t * 5) * 0.35;
      }

      if (mode === "gear5") {
        clouds.children.forEach((cl, i) => {
          const ph = t * 1.4 + i;
          cl.position.y = 1.1 + (i % 4) * 0.25 + Math.sin(ph) * 0.15;
          cl.scale.setScalar(0.85 + Math.sin(ph * 1.3) * 0.2);
        });
        body.rotation.z = Math.sin(t * 6) * 0.08;
        body.scale.setScalar(1 + Math.sin(t * 4) * 0.04);
      } else {
        body.rotation.z = 0;
        if (!rage) body.scale.setScalar(1);
      }
    },
  };
}
