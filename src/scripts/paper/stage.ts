/**
 * 화면 위에 고정된 WebGL 무대. 종이 한 장이 페이지의 [data-paper-slot] 자리들을 따라다닙니다.
 *
 *  - 위치/크기: 뷰포트 중앙에 가장 가까운 두 슬롯 사이를 스크롤 진행도로 보간합니다.
 *  - 내용: 슬롯(또는 hover 중인 [data-paper-hover] 요소)의 data-* 문구를 뒷면에 인쇄한 뒤 뒤집어 보여줍니다.
 *  - data-fold="plane" 슬롯에 가까워질수록 종이비행기로 접힙니다.
 */
import {
  AmbientLight, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, DirectionalLight, Euler, FrontSide,
  Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry,
  Quaternion, RepeatWrapping, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { buildSheet, deform, SHEET_H, SHEET_W, STAGES } from "./fold";
import { contentKey, drawSheet, loadSheetFonts, type SheetContent } from "./sheet-texture";

const FOV = 30;
const CAMERA_Z = 12;
const DEG = Math.PI / 180;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Slot = { el: HTMLElement; tilt: [number, number, number]; fold: number; shadow: number; content: SheetContent };

function readContent(el: HTMLElement): SheetContent {
  const d = el.dataset;
  return { label: d.label ?? "", title: d.title ?? "", body: d.body ?? "", foot: d.foot ?? "" };
}

function readSlot(el: HTMLElement): Slot {
  const tilt = (el.dataset.tilt ?? "0,0,0").split(",").map((v) => Number(v) * DEG) as [number, number, number];
  return { el, tilt, fold: el.dataset.fold === "plane" ? 1 : 0, shadow: Number(el.dataset.shadow ?? 0.2), content: readContent(el) };
}

export async function mountPaper() {
  const slotEls = [...document.querySelectorAll<HTMLElement>("[data-paper-slot]")];
  if (!slotEls.length) return;
  const slots = slotEls.map(readSlot);
  const hoverEls = [...document.querySelectorAll<HTMLElement>("[data-paper-hover]")];

  const canvas = document.createElement("canvas");
  canvas.className = "paper-stage";
  canvas.setAttribute("aria-hidden", "true");
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return; // WebGL이 없으면 CSS 종이 카드가 그대로 남습니다.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.z = CAMERA_Z;
  scene.add(new HemisphereLight(0xffffff, 0xc9c2e6, 1.55), new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xfff0dc, 1.7);
  sun.position.set(-3.5, 5, 7);
  scene.add(sun);

  // 종이
  const sheet = buildSheet();
  const geometry = new BufferGeometry();
  const positions = new Float32Array(sheet.count * 3);
  const normals = new Float32Array(sheet.count * 3);
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new BufferAttribute(sheet.uv, 2));

  const faces = [0, 1].map((index) => {
    const faceCanvas = document.createElement("canvas");
    const texture = new CanvasTexture(faceCanvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (index === 1) {
      // 뒷면은 좌우가 뒤집혀 보이므로 텍스처를 거울상으로 붙입니다.
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      texture.offset.x = 1;
    }
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.94, metalness: 0, side: index === 0 ? FrontSide : BackSide });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    return { canvas: faceCanvas, texture, mesh, key: "" };
  });
  const paper = new Group();
  paper.add(faces[0].mesh, faces[1].mesh);
  scene.add(paper);

  // 부드러운 그림자
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 180;
  const sctx = shadowCanvas.getContext("2d")!;
  sctx.filter = "blur(11px)";
  sctx.fillStyle = "rgb(24,18,60)";
  sctx.fillRect(26, 26, 76, 128);
  const shadowMaterial = new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, opacity: 0, depthWrite: false });
  const shadow = new Mesh(new PlaneGeometry(1, 180 / 128), shadowMaterial);
  shadow.renderOrder = -1;
  scene.add(shadow);

  await loadSheetFonts(slots.map((s) => s.content.title + s.content.body + s.content.label).join("") + hoverEls.map((el) => el.dataset.title ?? "").join(""));

  const print = (faceIndex: number, content: SheetContent) => {
    const face = faces[faceIndex];
    drawSheet(face.canvas, content);
    face.texture.needsUpdate = true;
    face.key = contentKey(content);
  };

  let viewW = 0, viewH = 0, worldPerPx = 0;
  const resize = () => {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    worldPerPx = (2 * CAMERA_Z * Math.tan((FOV * DEG) / 2)) / viewH;
  };
  resize();
  window.addEventListener("resize", resize);

  let hover: SheetContent | null = null;
  for (const el of hoverEls) {
    const enter = () => (hover = readContent(el));
    const leave = () => (hover = null);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", enter);
    el.addEventListener("focusout", leave);
  }
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / viewW) * 2 - 1;
    pointer.y = (event.clientY / viewH) * 2 - 1;
  }, { passive: true });

  // 슬롯의 화면 사각형 → 월드 좌표와 크기
  const place = (rect: DOMRect) => {
    const x = (rect.left + rect.width / 2 - viewW / 2) * worldPerPx;
    const y = -(rect.top + rect.height / 2 - viewH / 2) * worldPerPx;
    const scale = Math.min((rect.width * worldPerPx) / (2 * SHEET_W), (rect.height * worldPerPx) / (2 * SHEET_H));
    return { x, y, scale };
  };

  const state = { x: 0, y: 0, scale: 0.001, tx: 0, ty: 0, tz: 0, flip: 0, stage: 0, shadow: 0, bankX: 0, bankZ: 0, px: 0, py: 0 };
  let flipCount = 0;
  let shownKey = "";
  let first = true;
  let last = performance.now();
  const hasIntro = document.documentElement.dataset.paperIntro === "fly-in" && window.scrollY < 40;
  let intro = hasIntro ? 0 : 1;

  const qSheet = new Quaternion(), qPlane = new Quaternion(), qTemp = new Quaternion();
  const euler = new Euler();
  const Z = new Vector3(0, 0, 1), Y = new Vector3(0, 1, 0), X = new Vector3(1, 0, 0);

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    // 1. 뷰포트 중앙을 사이에 둔 두 슬롯을 찾습니다.
    const live = slots.map((slot) => ({ slot, rect: slot.el.getBoundingClientRect() })).filter((s) => s.rect.width > 2 && s.rect.height > 2);
    if (!live.length) return;
    const center = viewH / 2;
    let i = 0;
    for (let k = 0; k < live.length; k++) if (live[k].rect.top + live[k].rect.height / 2 <= center) i = k;
    const j = Math.min(i + 1, live.length - 1);
    const ci = live[i].rect.top + live[i].rect.height / 2, cj = live[j].rect.top + live[j].rect.height / 2;
    const t = j === i || cj - ci < 1 ? 0 : clamp((center - ci) / (cj - ci), 0, 1);
    const te = smooth((t - 0.28) / 0.44);
    const a = live[i], b = live[j];

    // 2. 목표 위치: 화면 밖으로 나간 슬롯을 따라 나가지 않고 가장자리에 머뭅니다.
    const pa = place(a.rect), pb = place(b.rect);
    const halfH = (viewH * worldPerPx) / 2, halfW = (viewW * worldPerPx) / 2;
    const rawY = mix(pa.y, pb.y, te);
    const transit = Math.sin(Math.PI * te);
    const laneX = halfW - Math.min(halfW * 0.16, 0.95);
    let targetX = clamp(mix(mix(pa.x, pb.x, te), laneX, transit * 0.9), -halfW * 0.92, halfW * 0.92);
    let targetY = clamp(rawY, -halfH * 0.72, halfH * 0.72);
    const away = Math.abs(rawY - targetY) / (halfH * 2);
    let targetScale = mix(pa.scale, pb.scale, te) * (1 - 0.55 * smooth((away - 0.25) / 0.9)) * (1 - 0.5 * transit);

    // 3. 접기: 슬롯의 fold 값 + 첫 진입 시 비행기로 날아 들어오는 인트로
    let targetStage = mix(a.slot.fold, b.slot.fold, te) * STAGES;
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 2.6);
      const fly = 1 - (1 - intro) ** 3;
      targetX += (1 - fly) * -halfW * 2.1;
      targetY += (1 - fly) * halfH * 0.35 + Math.sin(fly * Math.PI) * halfH * 0.18;
      targetStage = Math.max(targetStage, STAGES * (1 - smooth((intro - 0.38) / 0.55)));
    }

    // 4. 내용이 바뀌면 안 보이는 면에 인쇄하고 뒤집습니다.
    const wanted = hover ?? (te < 0.5 ? a : b).slot.content;
    const wantedKey = contentKey(wanted);
    if (!shownKey) {
      print(0, wanted);
      print(1, wanted);
      shownKey = wantedKey;
    } else if (wantedKey !== shownKey && Math.abs(state.flip - flipCount * Math.PI) < 0.22) {
      flipCount += 1;
      print(flipCount % 2, wanted);
      shownKey = wantedKey;
    }

    // 5. 감쇠 추종
    const k = first ? 1 : 1 - Math.exp(-dt * 5.2);
    const kSlow = first ? 1 : 1 - Math.exp(-dt * 3.4);
    const tilt = [0, 1, 2].map((n) => mix(a.slot.tilt[n], b.slot.tilt[n], te));
    state.x = mix(state.x, targetX, k);
    state.y = mix(state.y, targetY, k);
    state.scale = mix(state.scale, targetScale, k);
    state.tx = mix(state.tx, tilt[0] + pointer.y * 0.1, kSlow);
    state.ty = mix(state.ty, tilt[1] + pointer.x * 0.16, kSlow);
    state.tz = mix(state.tz, tilt[2], kSlow);
    state.flip = mix(state.flip, flipCount * Math.PI, first ? 1 : 1 - Math.exp(-dt * 4.2));
    state.stage = intro < 1 ? targetStage : mix(state.stage, targetStage, first ? 1 : 1 - Math.exp(-dt * 6));
    state.shadow = mix(state.shadow, mix(a.slot.shadow, b.slot.shadow, te), kSlow);
    const vx = first ? 0 : (state.x - state.px) / Math.max(dt, 0.001), vy = first ? 0 : (state.y - state.py) / Math.max(dt, 0.001);
    state.bankZ = mix(state.bankZ, clamp(-vx * 0.05, -0.5, 0.5), kSlow);
    state.bankX = mix(state.bankX, clamp(vy * 0.06, -0.6, 0.6), kSlow);
    state.px = state.x;
    state.py = state.y;
    first = false;

    // 6. 자세: 펼친 종이의 자세와 비행 자세를 접힌 정도로 섞습니다.
    const folded = smooth(state.stage / 1.6);
    const bob = Math.sin(time * 0.9) * 0.05;
    euler.set(state.tx + state.bankX + bob * 0.6, state.ty + state.flip, state.tz + state.bankZ + Math.sin(time * 0.7) * 0.025, "YXZ");
    qSheet.setFromEuler(euler);
    qPlane.setFromAxisAngle(X, -24 * DEG + state.bankX * 0.6)
      .multiply(qTemp.setFromAxisAngle(Z, -72 * DEG + bob + state.bankZ * 0.5))
      .multiply(qTemp.setFromAxisAngle(Y, 28 * DEG + Math.sin(time * 1.3) * 0.08));
    paper.quaternion.slerpQuaternions(qSheet, qPlane, folded);
    paper.position.set(state.x, state.y + bob * state.scale * (0.6 + folded), 0);
    paper.scale.setScalar(state.scale * mix(1, 0.86, folded));

    deform(sheet, positions, normals, time, 0.055, state.stage);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

    shadow.position.set(state.x + 0.16 * state.scale, state.y - 0.24 * state.scale, -0.8);
    shadow.scale.set(state.scale * mix(3.0, 2.3, folded), state.scale * mix(3.0, 1.4, folded), 1);
    shadow.rotation.z = mix(state.tz, -0.3, folded);
    shadowMaterial.opacity = state.shadow;

    renderer.render(scene, camera);
    if (!canvas.isConnected) {
      document.body.append(canvas);
      document.documentElement.classList.add("has-paper");
    }
  };
  requestAnimationFrame(frame);
}
