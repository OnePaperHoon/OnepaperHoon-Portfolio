/**
 * 화면 위에 고정된 WebGL 무대. 종이 한 장이 페이지의 [data-paper-slot] 자리들을 따라다닙니다.
 *
 *  - 위치/크기: 뷰포트 중앙에 가장 가까운 두 슬롯 사이를 스크롤 진행도로 보간합니다.
 *  - 내용: 슬롯(또는 hover 중인 [data-paper-hover] 요소)의 data-* 문구를 안 보이는 면에 인쇄한 뒤 뒤집어 보여줍니다.
 *  - 모양: data-fold="plane" 슬롯에서는 종이비행기로 접히고, data-fold="ball" 슬롯에서는 구겨져 뭉칩니다. 둘 다 던질 수 있습니다.
 *  - 만지기: 펼친 종이는 어디서든 마우스로 잡아 끌 수 있고(잡힌 곳에서 휩니다), 가까이서 마우스를 휘두르면 바람에 밀립니다.
 *  - 페이지 이동: 무대는 ClientRouter 사이에도 살아 있습니다. 이동할 때 종이가 화면을 덮을 만큼 커져 다음 페이지가 되고,
 *    새 페이지에서 다시 작아지며 제자리로 내려앉습니다.
 */
import {
  AmbientLight, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, DirectionalLight, Euler, FrontSide,
  Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry,
  Points, PointsMaterial, Quaternion, RepeatWrapping, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { play } from "../sound";
import { buildSheet, deform, SHEET_H, SHEET_W, STAGES } from "./fold";
import { contentKey, drawSheet, loadSheetFonts, type SheetContent } from "./sheet-texture";

const FOV = 30;
const CAMERA_Z = 12;
const DEG = Math.PI / 180;
const CRUISE = 18 * DEG; // 비행기가 가만히 떠 있을 때 기수가 향하는 각도
const TRAIL_MAX = 110;
const TRAIL_LIFE = 1.7;
const INTERACTIVE = "a, button, input, textarea, select, summary, [role='button'], [contenteditable]";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Shape = "sheet" | "plane" | "ball";
type Slot = { el: HTMLElement; tilt: [number, number, number]; shape: Shape; shadow: number; backlit: number; content: SheetContent };

function readContent(el: HTMLElement): SheetContent {
  const d = el.dataset;
  return { label: d.label ?? "", title: d.title ?? "", body: d.body ?? "", foot: d.foot ?? "" };
}

function readSlot(el: HTMLElement): Slot {
  const tilt = (el.dataset.tilt ?? "0,0,0").split(",").map((v) => Number(v) * DEG) as [number, number, number];
  const fold = el.dataset.fold;
  return {
    el, tilt, content: readContent(el),
    shape: fold === "plane" || fold === "ball" ? fold : "sheet",
    shadow: Number(el.dataset.shadow ?? 0.2),
    backlit: Number(el.dataset.backlit ?? 0.07),
  };
}

let rescanPage: (() => void) | null = null;

/** 처음 부르면 무대를 세우고, 그 뒤로는 새 페이지의 슬롯만 다시 읽습니다. */
export async function mountPaper() {
  if (rescanPage) return rescanPage();
  if (!document.querySelector("[data-paper-slot]")) return;

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

  // ---------- 종이 ----------
  const sheet = buildSheet();
  const geometry = new BufferGeometry();
  const positions = new Float32Array(sheet.count * 3);
  const normals = new Float32Array(sheet.count * 3);
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new BufferAttribute(sheet.uv, 2));

  const textures = [0, 1].map((index) => {
    const texture = new CanvasTexture(document.createElement("canvas"));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (index === 1) {
      // 뒷면은 좌우가 뒤집혀 보이므로 텍스처를 거울상으로 붙입니다.
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      texture.offset.x = 1;
    }
    return texture;
  });
  // 역광: 종이가 얇아서 반대쪽 면의 인쇄가 거울상으로 흐릿하게 비칩니다.
  const ghost = { value: 0.1 };
  // 덮기: 종이가 화면을 덮을 만큼 커지면 인쇄와 음영이 사라지고 페이지 바탕색(크림) 한 장이 됩니다.
  const blank = { value: 0 };
  const paper = new Group();
  textures.forEach((texture, index) => {
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.94, metalness: 0, side: index === 0 ? FrontSide : BackSide });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.ghostMap = { value: textures[1 - index] };
      shader.uniforms.uGhost = ghost;
      shader.uniforms.uBlank = blank;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D ghostMap;\nuniform float uGhost;\nuniform float uBlank;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          vec3 ghostInk = texture2D( ghostMap, vec2( 1.0 - vMapUv.x, vMapUv.y ), 3.0 ).rgb;
          float ghostTone = smoothstep( 0.05, 0.95, dot( ghostInk, vec3( 0.3333 ) ) );
          diffuseColor.rgb *= mix( 1.0, ghostTone, uGhost * ( 1.0 - uBlank ) );
          diffuseColor.rgb += uGhost * vec3( 0.05, 0.028, 0.0 );`)
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
          gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( 0.9725, 0.9569, 0.9255 ), uBlank );`);
    };
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    paper.add(mesh);
  });
  scene.add(paper);

  // ---------- 그림자 ----------
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

  // ---------- 점선 비행 궤적 ----------
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 32;
  const dctx = dotCanvas.getContext("2d")!;
  dctx.fillStyle = "#fff";
  dctx.beginPath();
  dctx.arc(16, 16, 13, 0, Math.PI * 2);
  dctx.fill();
  const trailPositions = new Float32Array(TRAIL_MAX * 3);
  const trailColors = new Float32Array(TRAIL_MAX * 4);
  const trailGeometry = new BufferGeometry();
  trailGeometry.setAttribute("position", new BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute("color", new BufferAttribute(trailColors, 4));
  trailGeometry.setDrawRange(0, 0);
  const trail = new Points(trailGeometry, new PointsMaterial({ size: 7, sizeAttenuation: false, map: new CanvasTexture(dotCanvas), transparent: true, vertexColors: true, depthWrite: false }));
  trail.frustumCulled = false;
  trail.renderOrder = -2;
  scene.add(trail);
  // 점은 하늘에 찍힌 것이므로 페이지와 함께 스크롤됩니다: 찍힌 순간의 scrollY를 같이 기억합니다.
  let trailDots: { x: number; y: number; born: number; scroll: number; ink: boolean }[] = [];

  const print = (faceIndex: number, content: SheetContent) => {
    drawSheet(textures[faceIndex].image as HTMLCanvasElement, content);
    textures[faceIndex].needsUpdate = true;
  };

  // ---------- 화면 ----------
  let viewW = 0, viewH = 0, worldPerPx = 0, halfW = 0, halfH = 0;
  const resize = () => {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    worldPerPx = (2 * CAMERA_Z * Math.tan((FOV * DEG) / 2)) / viewH;
    halfW = (viewW * worldPerPx) / 2;
    halfH = (viewH * worldPerPx) / 2;
  };
  resize();
  window.addEventListener("resize", resize);
  const toWorld = (clientX: number, clientY: number) => ({ x: (clientX - viewW / 2) * worldPerPx, y: -(clientY - viewH / 2) * worldPerPx });
  const place = (rect: DOMRect) => {
    const center = toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const scale = Math.min((rect.width * worldPerPx) / (2 * SHEET_W), (rect.height * worldPerPx) / (2 * SHEET_H));
    return { ...center, scale };
  };

  // 포인터 아래에 종이가 있는지: 카메라에서 쏜 반직선을 종이 평면과 만나게 한 뒤 종이의 좌표계로 옮겨 봅니다.
  const ray = new Vector3(), normal = new Vector3(), hitPoint = new Vector3(), inverse = new Quaternion();
  const hitPaper = (clientX: number, clientY: number) => {
    ray.set((clientX / viewW) * 2 - 1, -((clientY / viewH) * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize();
    normal.set(0, 0, 1).applyQuaternion(paper.quaternion);
    const facing = ray.dot(normal);
    if (Math.abs(facing) < 1e-4) return null;
    const distance = hitPoint.copy(paper.position).sub(camera.position).dot(normal) / facing;
    hitPoint.copy(ray).multiplyScalar(distance).add(camera.position).sub(paper.position).applyQuaternion(inverse.copy(paper.quaternion).invert()).divideScalar(paper.scale.x || 1);
    return Math.abs(hitPoint.x) <= SHEET_W && Math.abs(hitPoint.y) <= SHEET_H ? { x: hitPoint.x, y: hitPoint.y } : null;
  };

  // ---------- 페이지의 슬롯 ----------
  let slots: Slot[] = [];
  let scanId = 0;
  const scan = async () => {
    const id = ++scanId;
    const next = [...document.querySelectorAll<HTMLElement>("[data-paper-slot]")].map(readSlot);
    const hoverText = [...document.querySelectorAll<HTMLElement>("[data-paper-hover]")].map((el) => (el.dataset.title ?? "") + (el.dataset.label ?? "") + (el.dataset.body ?? "")).join("");
    await Promise.race([
      loadSheetFonts(next.map((s) => s.content.title + s.content.body + s.content.label + s.content.foot).join("") + hoverText),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ]);
    if (id !== scanId) return;
    for (const slot of next) {
      if (slot.shape === "sheet") continue;
      slot.el.setAttribute("role", "button");
      slot.el.setAttribute("tabindex", "0");
      slot.el.setAttribute("aria-label", slot.shape === "plane" ? "종이비행기 날리기" : "구겨진 종이 던지기");
    }
    slots = next;
    if (covering) { covering = false; landing = 1; play("land"); }
  };
  document.addEventListener("astro:after-swap", () => {
    slots = [];
    hover = hoverEl = null;
    if (canvas.isConnected) document.documentElement.classList.add("has-paper");
  });
  rescanPage = () => void scan();

  // ---------- 페이지 이동: 종이가 화면을 덮는 동안 다음 페이지를 불러옵니다 ----------
  let covering = false;
  let landing = 0; // 새 페이지에 내려앉는 동안 1 → 0
  let coverTimer = 0;
  document.addEventListener("astro:before-preparation", (event) => {
    const navigation = event as Event & { navigationType?: string; loader: () => Promise<void> };
    if (navigation.navigationType === "traverse" || document.hidden) return; // 뒤로/앞으로는 곧바로
    covering = true;
    mode = "idle";
    flutter = 0;
    document.documentElement.classList.add("is-covering");
    play("turn");
    window.clearTimeout(coverTimer);
    coverTimer = window.setTimeout(() => { covering = false; }, 4000); // 무슨 일이 있어도 화면을 덮은 채로 남지 않게
    const load = navigation.loader;
    navigation.loader = async () => {
      await Promise.all([load(), new Promise((resolve) => setTimeout(resolve, 540))]);
    };
  });
  document.addEventListener("astro:page-load", () => document.documentElement.classList.remove("is-covering"));

  // ---------- 포인터 ----------
  let hover: SheetContent | null = null;
  let hoverEl: HTMLElement | null = null;
  const hoverTarget = (event: Event) => (event.target as Element | null)?.closest?.<HTMLElement>("[data-paper-hover]") ?? null;
  const enter = (event: Event) => { const el = hoverTarget(event); if (el) { hoverEl = el; hover = readContent(el); } };
  const leave = (event: Event) => { if (hoverTarget(event)) hover = hoverEl = null; };
  document.addEventListener("pointerover", enter);
  document.addEventListener("pointerout", leave);
  document.addEventListener("focusin", enter);
  document.addEventListener("focusout", leave);

  const pointer = { x: 0, y: 0, clientX: -1, clientY: -1, wx: 0, wy: 0, vx: 0, vy: 0, at: 0 };
  let samples: { x: number; y: number; at: number }[] = [];
  const isSheet = () => state.stage < 0.5 && state.crumple < 0.5;
  const canGrab = (event: PointerEvent) => event.pointerType !== "touch" && mode === "idle" && !covering && isSheet()
    && !(event.target as Element | null)?.closest?.(INTERACTIVE) && hitPaper(event.clientX, event.clientY);
  window.addEventListener("pointermove", (event) => {
    const now = performance.now(), world = toWorld(event.clientX, event.clientY);
    const span = Math.max((now - pointer.at) / 1000, 0.008);
    if (pointer.at && span < 0.12) {
      pointer.vx = mix(pointer.vx, (world.x - pointer.wx) / span, 0.45);
      pointer.vy = mix(pointer.vy, (world.y - pointer.wy) / span, 0.45);
    }
    Object.assign(pointer, { clientX: event.clientX, clientY: event.clientY, wx: world.x, wy: world.y, at: now, x: (event.clientX / viewW) * 2 - 1, y: (event.clientY / viewH) * 2 - 1 });
    if (mode === "drag") {
      samples.push({ ...world, at: now });
      if (samples.length > 8) samples.shift();
    } else {
      document.documentElement.classList.toggle("paper-hot", Boolean(canGrab(event)));
    }
  }, { passive: true });

  // ---------- 던지기와 잡기 ----------
  type Mode = "idle" | "drag" | "flying" | "gone";
  let mode: Mode = "idle";
  let dragKind: "throw" | "hold" = "throw";
  let grab = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0 };
  let thrown: Shape = "plane";
  let modeTime = 0;
  let flutter = 0; // 새 종이가 떨어져 내려오는 동안 1 → 0
  let dragStart = { x: 0, y: 0 };
  const throwSlot = (event: Event) => (event.target as Element | null)?.closest?.<HTMLElement>("[data-paper-slot][data-fold]") ?? null;
  const throwable = () => state.stage > STAGES - 0.4 || state.crumple > 0.9;
  const launch = (vx?: number, vy?: number) => {
    if (mode === "flying" || mode === "gone" || covering || !throwable()) return false;
    thrown = state.crumple > 0.5 ? "ball" : "plane";
    mode = "flying";
    modeTime = 0;
    velocity = vx === undefined || vy === undefined
      ? thrown === "ball" ? { x: 3.4, y: 6.2 } : { x: Math.cos(CRUISE) * 5.2, y: Math.sin(CRUISE) * 5.2 }
      : { x: vx, y: vy };
    play("whoosh");
    return true;
  };
  document.addEventListener("paper:throw", (event) => (event as CustomEvent<{ done?: (ok: boolean) => void }>).detail?.done?.(launch()));
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || mode !== "idle" || covering) return;
    const grabbed = throwSlot(event) && throwable() ? null : canGrab(event);
    if (!(throwSlot(event) && throwable()) && !grabbed) return;
    mode = "drag";
    dragKind = grabbed ? "hold" : "throw";
    if (grabbed) grab = grabbed;
    dragStart = { x: event.clientX, y: event.clientY };
    samples = [{ ...toWorld(event.clientX, event.clientY), at: performance.now() }];
    document.documentElement.classList.add("paper-grabbing");
    event.preventDefault();
  });
  window.addEventListener("pointerup", (event) => {
    if (mode !== "drag") return;
    mode = "idle";
    document.documentElement.classList.remove("paper-grabbing");
    if (dragKind === "hold") {
      flutter = 0.6; // 놓으면 팔랑거리며 제자리로
      play("flip");
      return;
    }
    const moved = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    const a = samples[0], b = samples[samples.length - 1];
    const span = Math.max((b.at - a.at) / 1000, 0.016);
    let vx = (b.x - a.x) / span, vy = (b.y - a.y) / span;
    const speed = Math.hypot(vx, vy);
    if (moved < 8 || speed < 1.5) return void launch();
    const capped = clamp(speed, 4.5, 15);
    vx *= capped / speed;
    vy *= capped / speed;
    launch(vx, vy);
  });
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (target?.closest?.("[data-paper-launch]")) return void launch();
    // 터치와 키보드는 누르기만 해도 날아갑니다 (마우스는 pointerup에서 처리).
    if (throwSlot(event) && (event.detail === 0 || (event as PointerEvent).pointerType === "touch")) launch();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && throwSlot(event)) { event.preventDefault(); launch(); }
  });

  // ---------- 상태 ----------
  const state = { x: 0, y: 0, scale: 0.001, tx: 0, ty: 0, tz: 0, flip: 0, stage: 0, crumple: 0, shadow: 0, bankX: 0, bankZ: 0, px: 0, py: 0, heading: CRUISE, shrink: 1, bend: 0, cover: 0, gustX: 0, gustY: 0, spin: 0 };
  let flipCount = 0;
  let shownKey = "";
  let first = true;
  let last = performance.now();
  let intro = document.documentElement.dataset.paperIntro === "fly-in" && window.scrollY < 40 ? 0 : 1;
  let lastTarget = { x: 0, y: 0, scale: 1, stage: 0, crumple: 0, tilt: [0, 0, 0], shadow: 0, backlit: 0.1 };
  let wasCrumpling = false;

  const qSheet = new Quaternion(), qPlane = new Quaternion(), qBall = new Quaternion(), qTemp = new Quaternion();
  const euler = new Euler();
  const Z = new Vector3(0, 0, 1), Y = new Vector3(0, 1, 0), X = new Vector3(1, 0, 0), tumble = new Vector3(0.5, 0.8, 0.3).normalize();

  await scan();

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    modeTime += dt;

    // 1. 뷰포트 중앙을 사이에 둔 두 슬롯 → 목표 자세. 슬롯이 없는 순간(페이지 전환 중)에는 직전 목표를 유지합니다.
    const live = slots.map((slot) => ({ slot, rect: slot.el.getBoundingClientRect() })).filter((s) => s.rect.width > 2 && s.rect.height > 2);
    // 스크롤로 멀어지면 pointerout이 오지 않으므로, 실제로 올려져 있는지 직접 확인합니다.
    if (hoverEl && !(hoverEl.isConnected && (hoverEl.matches(":hover") || hoverEl.contains(document.activeElement)))) hover = hoverEl = null;
    let wanted: SheetContent | null = hover;
    if (live.length) {
      const center = viewH / 2;
      let i = 0;
      for (let k = 0; k < live.length; k++) if (live[k].rect.top + live[k].rect.height / 2 <= center) i = k;
      const j = Math.min(i + 1, live.length - 1);
      const ci = live[i].rect.top + live[i].rect.height / 2, cj = live[j].rect.top + live[j].rect.height / 2;
      const t = j === i || cj - ci < 1 ? 0 : clamp((center - ci) / (cj - ci), 0, 1);
      const te = smooth((t - 0.28) / 0.44);
      const a = live[i], b = live[j];
      const pa = place(a.rect), pb = place(b.rect);

      // 화면 밖으로 나간 슬롯을 따라 나가지 않고 가장자리에 머뭅니다. 슬롯 사이는 오른쪽 가장자리를 타고 작게 이동합니다.
      const transit = Math.sin(Math.PI * te);
      const laneX = halfW - Math.min(halfW * 0.16, 0.95);
      const rawY = mix(pa.y, pb.y, te);
      const y = clamp(rawY, -halfH * 0.72, halfH * 0.72);
      const away = Math.abs(rawY - y) / (halfH * 2);
      lastTarget = {
        x: clamp(mix(mix(pa.x, pb.x, te), laneX, transit * 0.9), -halfW * 0.92, halfW * 0.92),
        y,
        scale: mix(pa.scale, pb.scale, te) * (1 - 0.55 * smooth((away - 0.25) / 0.9)) * (1 - 0.5 * transit),
        stage: mix(a.slot.shape === "plane" ? 1 : 0, b.slot.shape === "plane" ? 1 : 0, te) * STAGES,
        crumple: mix(a.slot.shape === "ball" ? 1 : 0, b.slot.shape === "ball" ? 1 : 0, te),
        tilt: [0, 1, 2].map((n) => mix(a.slot.tilt[n], b.slot.tilt[n], te)),
        shadow: mix(a.slot.shadow, b.slot.shadow, te),
        backlit: mix(a.slot.backlit, b.slot.backlit, te),
      };
      wanted ??= (te < 0.5 ? a : b).slot.content;
    }
    let { x: targetX, y: targetY, scale: targetScale, stage: targetStage, crumple: targetCrumple } = lastTarget;

    // 2. 첫 진입: 비행기로 날아 들어와 펼쳐집니다.
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 2.6);
      const fly = 1 - (1 - intro) ** 3;
      targetX += (1 - fly) * -halfW * 2.1;
      targetY += (1 - fly) * halfH * 0.35 + Math.sin(fly * Math.PI) * halfH * 0.18;
      targetStage = Math.max(targetStage, STAGES * (1 - smooth((intro - 0.38) / 0.55)));
      targetCrumple = 0;
    }
    if (mode === "drag") {
      // 잡은 지점이 커서 아래에 머물도록
      targetX = pointer.wx - (dragKind === "hold" ? grab.x * state.scale : 0);
      targetY = pointer.wy - (dragKind === "hold" ? grab.y * state.scale : 0);
    }
    if (flutter > 0) {
      flutter = Math.max(0, flutter - dt / 1.5);
      if (flutter > 0.35) targetStage = targetCrumple = 0; // 다 내려올 때쯤 다시 접히거나 구겨집니다
    }
    // 페이지 이동 중: 화면 한가운데에서, 화면을 넉넉히 덮는 크기의 반듯한 종이로
    const coverScale = Math.max(halfW / SHEET_W, halfH / SHEET_H) * 1.2;
    if (covering) {
      targetX = targetY = targetStage = targetCrumple = 0;
      targetScale = coverScale;
    }
    landing = Math.max(0, landing - dt / 1.1);
    state.cover = mix(state.cover, covering ? 1 : 0, 1 - Math.exp(-dt * 9));
    const calm = 1 - state.cover;
    blank.value = smooth((state.scale / coverScale - 0.28) / 0.5);

    // 3. 내용이 바뀌면 안 보이는 면에 인쇄하고 뒤집습니다. 화면을 덮은 백지 상태라면 보이는 면에 바로 인쇄합니다.
    if (wanted) {
      const wantedKey = contentKey(wanted);
      if (!shownKey) {
        print(0, wanted);
        print(1, slots.find((slot) => contentKey(slot.content) !== wantedKey)?.content ?? wanted);
        shownKey = wantedKey;
      } else if (wantedKey !== shownKey && blank.value > 0.92) {
        print(flipCount % 2, wanted);
        shownKey = wantedKey;
      } else if (wantedKey !== shownKey && Math.abs(state.flip - flipCount * Math.PI) < 0.22 && mode === "idle" && !covering) {
        flipCount += 1;
        print(flipCount % 2, wanted);
        shownKey = wantedKey;
        play("flip");
      }
    }
    if (targetCrumple > 0.5 && !wasCrumpling && state.crumple < 0.4) play("crumple");
    wasCrumpling = targetCrumple > 0.5;

    // 4. 움직임
    const pace = covering ? 7.5 : mode === "drag" ? 14 : landing > 0 ? 3.4 : flutter > 0 ? 2.4 : 5.2;
    const k = first ? 1 : 1 - Math.exp(-dt * pace);
    const kSlow = first ? 1 : 1 - Math.exp(-dt * 3.4);
    if (mode === "flying") {
      if (thrown === "ball") {
        velocity.y -= dt * 9.5; // 뭉치는 포물선으로 떨어집니다
        state.spin += dt * 7;
      } else {
        // 비행기는 양력을 조금 받아 위로 휘면서 멀어집니다.
        velocity.x *= 1 + dt * 0.9;
        velocity.y = velocity.y * (1 + dt * 0.9) + dt * 1.6;
        state.heading = Math.atan2(velocity.y, velocity.x);
      }
      state.x += velocity.x * dt;
      state.y += velocity.y * dt;
      state.shrink = Math.max(0.35, state.shrink - dt * 0.32);
      const reach = Math.max(Math.abs(state.x) - halfW, Math.abs(state.y) - halfH);
      if (reach > 3 * state.scale || modeTime > 3) { mode = "gone"; modeTime = 0; }
    } else if (mode === "gone") {
      if (modeTime > 0.45) {
        // 새 종이 한 장이 위에서 팔랑거리며 내려옵니다.
        mode = "idle";
        flutter = 1;
        state.x = targetX + halfW * 0.08;
        state.y = halfH + SHEET_H * targetScale * 1.3;
        state.scale = targetScale;
        state.stage = state.crumple = 0;
        state.shrink = 1;
        state.heading = CRUISE;
        trailDots = [];
      }
    } else {
      state.x = mix(state.x, targetX, k);
      state.y = mix(state.y, targetY, k);
      state.scale = mix(state.scale, targetScale, k);
      state.shrink = mix(state.shrink, 1, k);
      state.heading = mix(state.heading, CRUISE, kSlow);
      state.stage = intro < 1 ? targetStage : mix(state.stage, targetStage, first ? 1 : 1 - Math.exp(-dt * (flutter > 0 ? 3 : covering ? 9 : 6)));
      state.crumple = mix(state.crumple, targetCrumple, first ? 1 : 1 - Math.exp(-dt * (covering ? 9 : 2.6)));
    }

    // 바람: 종이 가까이에서 마우스를 빠르게 움직이면 그쪽으로 밀립니다.
    const decay = Math.exp(-dt * 9);
    pointer.vx *= decay;
    pointer.vy *= decay;
    if (mode === "idle" && !covering && pointer.clientX >= 0) {
      const reachOf = 2.6 * state.scale, away = Math.hypot(pointer.wx - state.x, pointer.wy - state.y), speed = Math.hypot(pointer.vx, pointer.vy);
      if (away < reachOf && speed > 2.5) {
        const push = (1 - away / reachOf) * dt * 0.42;
        state.gustX += pointer.vx * push;
        state.gustY += pointer.vy * push;
      }
    }
    const gustLimit = 0.85 * state.scale, gustSize = Math.hypot(state.gustX, state.gustY);
    if (gustSize > gustLimit) { state.gustX *= gustLimit / gustSize; state.gustY *= gustLimit / gustSize; }
    const settle = Math.exp(-dt * 2.4);
    state.gustX *= settle;
    state.gustY *= settle;
    const gustTiltX = (state.gustY / Math.max(state.scale, 0.01)) * 0.5, gustTiltZ = (-state.gustX / Math.max(state.scale, 0.01)) * 0.45;

    const dragSpeed = mode === "drag" && dragKind === "hold" ? Math.hypot(pointer.vx, pointer.vy) : 0;
    state.bend = mix(state.bend, mode === "drag" && dragKind === "hold" ? clamp(0.12 + dragSpeed * 0.03, 0, 0.42) : 0, 1 - Math.exp(-dt * 7));
    const sway = smooth(flutter / 0.6);
    state.tx = mix(state.tx, (lastTarget.tilt[0] + pointer.y * 0.1) * calm, kSlow);
    state.ty = mix(state.ty, (lastTarget.tilt[1] + pointer.x * 0.16) * calm, kSlow);
    state.tz = mix(state.tz, lastTarget.tilt[2] * calm, covering ? k : kSlow);
    state.flip = mix(state.flip, flipCount * Math.PI, first ? 1 : 1 - Math.exp(-dt * 4.2));
    state.shadow = mix(state.shadow, mode === "idle" ? lastTarget.shadow * (1 - sway) * calm * (1 - blank.value) : 0, mode === "idle" ? kSlow : 1 - Math.exp(-dt * 18)); // 던지면 그림자는 바로 사라집니다
    ghost.value = mix(ghost.value, lastTarget.backlit, kSlow);
    const vx = first ? 0 : (state.x - state.px) / Math.max(dt, 0.001), vy = first ? 0 : (state.y - state.py) / Math.max(dt, 0.001);
    state.bankZ = mix(state.bankZ, clamp(-vx * 0.05, -0.5, 0.5) * calm, kSlow);
    state.bankX = mix(state.bankX, clamp(vy * 0.06, -0.6, 0.6) * calm, kSlow);
    state.px = state.x;
    state.py = state.y;
    first = false;

    // 5. 자세: 펼친 종이 · 비행기 · 구겨진 뭉치의 자세를 접힌/구겨진 정도로 섞습니다.
    const folded = smooth(state.stage / 1.6);
    const bob = Math.sin(time * 0.9) * 0.05 * calm;
    euler.set(
      state.tx + state.bankX + bob * 0.6 + sway * Math.cos(time * 3.1) * 0.55 + gustTiltX,
      state.ty + state.flip + sway * Math.sin(time * 2.3) * 0.5,
      state.tz + state.bankZ + Math.sin(time * 0.7) * 0.025 * calm + sway * Math.sin(time * 3.7) * 0.4 + gustTiltZ,
      "YXZ",
    );
    qSheet.setFromEuler(euler);
    const banking = mode === "flying" ? 0 : 1;
    qPlane.setFromAxisAngle(X, -24 * DEG + state.bankX * 0.6 * banking)
      .multiply(qTemp.setFromAxisAngle(Z, state.heading - 90 * DEG + (bob + state.bankZ * 0.5) * banking))
      .multiply(qTemp.setFromAxisAngle(Y, 28 * DEG + Math.sin(time * 1.3) * 0.08));
    paper.quaternion.slerpQuaternions(qSheet, qPlane, folded);
    if (state.crumple > 0.001) {
      qBall.setFromAxisAngle(tumble, time * 0.35 + state.spin).multiply(qTemp.setFromAxisAngle(X, -0.3));
      paper.quaternion.slerp(qBall, smooth(state.crumple));
    }
    paper.visible = mode !== "gone";
    paper.position.set(state.x + state.gustX + sway * Math.sin(time * 2.3) * 0.5 * state.scale, state.y + state.gustY + bob * state.scale * (0.6 + folded), 0);
    paper.scale.setScalar(state.scale * mix(1, 0.86, folded) * state.shrink);

    deform(sheet, positions, normals, time, (0.055 + sway * 0.06) * calm * (1 - blank.value), state.stage, { crumple: state.crumple, bendX: grab.x, bendY: grab.y, bend: state.bend });
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

    const lump = smooth(state.crumple);
    shadow.position.set(state.x + state.gustX + 0.16 * state.scale, state.y + state.gustY - mix(0.24, 0.62, lump) * state.scale, -0.8);
    shadow.scale.set(state.scale * mix(mix(3.0, 2.3, folded), 1.9, lump), state.scale * mix(mix(3.0, 1.4, folded), 0.9, lump), 1);
    shadow.rotation.z = mix(state.tz, -0.3, folded) * (1 - lump);
    shadowMaterial.opacity = state.shadow;

    // 6. 점선 궤적: 날아다니는 동안 꼬리 뒤에 점을 떨어뜨립니다.
    if ((intro < 1 || mode === "flying") && (folded > 0.5 || lump > 0.5)) {
      const back = lump > 0.5 ? 0 : state.scale * 1.15;
      const tailX = state.x - Math.cos(state.heading) * back, tailY = state.y - Math.sin(state.heading) * back;
      const lastDot = trailDots[trailDots.length - 1];
      const drift = lastDot ? (window.scrollY - lastDot.scroll) * worldPerPx : 0;
      if (!lastDot || Math.hypot(tailX - lastDot.x, tailY - lastDot.y - drift) > 0.17) trailDots.push({ x: tailX, y: tailY, born: time, scroll: window.scrollY, ink: lump > 0.5 });
    }
    trailDots = trailDots.filter((dot) => time - dot.born < TRAIL_LIFE).slice(-TRAIL_MAX);
    trailDots.forEach((dot, n) => {
      trailPositions.set([dot.x, dot.y + (window.scrollY - dot.scroll) * worldPerPx, -0.4], n * 3);
      const shade = dot.ink ? 0.16 : 1; // 크림색 페이지 위에서는 잉크색 점
      trailColors.set([shade, shade, shade * 1.4, 0.9 * (1 - (time - dot.born) / TRAIL_LIFE) ** 1.5], n * 4);
    });
    trailGeometry.setDrawRange(0, trailDots.length);
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
    if (!canvas.isConnected) {
      (document.getElementById("paper-root") ?? document.body).append(canvas);
      document.documentElement.classList.add("has-paper");
    }
  };
  requestAnimationFrame(frame);
}
