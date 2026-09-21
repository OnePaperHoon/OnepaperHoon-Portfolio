/**
 * 셰이더 하늘. 콘텐츠 뒤에 고정된 캔버스 하나가, 지금 화면에 가장 크게 보이는 [data-sky] 상자 자리에만 하늘을 그립니다.
 *
 *  - 색은 전부 CSS 변수(--sky-1..4, --sun, --cloud …)에서 읽습니다. 같은 변수로 CSS 그라데이션 폴백도 그리므로
 *    시간대 팔레트는 global.css 한 곳에서만 고칩니다.
 *  - 하늘을 그리는 동안 그 상자에는 .is-live가 붙어 CSS 폴백 배경이 꺼집니다. WebGL이 없으면 폴백이 그대로 남습니다.
 *  - 구름은 부드러워서 절반 해상도, 30fps로 그립니다.
 */

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec4 uRect; // x, top, w, h (캔버스 px, 위에서부터)
uniform float uTime, uClouds, uStars, uSunSize, uSunDisc, uSeed;
uniform float uUnit; // 상자 높이 1 = 화면 높이의 몇 배인지. 해·구름·별의 크기는 상자가 아니라 화면 기준으로 잡습니다.
uniform vec3 uC0, uC1, uC2, uC3, uSun, uCloud, uShade;
uniform vec2 uSunPos;

float hash(vec2 v) { return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 v) {
  vec2 i = floor(v), f = fract(v);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 v) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(v); v = v * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
  return s / 0.9375;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (px - uRect.xy) / uRect.zw;
  if (uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  float v = uv.y;
  float aspect = uRect.z / uRect.w;
  vec2 p = vec2(uv.x * aspect, v) * uUnit;
  vec2 sunP = vec2(uSunPos.x * aspect, uSunPos.y) * uUnit;

  // 하늘: CSS 폴백과 같은 위치의 네 단 그라데이션
  vec3 c = mix(uC0, uC1, smoothstep(0.0, 0.35, v));
  c = mix(c, uC2, smoothstep(0.35, 0.65, v));
  c = mix(c, uC3, smoothstep(0.65, 1.0, v));

  // 별: 위쪽일수록 많고, 깜빡입니다
  vec2 g = p * 64.0, id = floor(g);
  float h = hash(id + uSeed);
  vec2 off = (vec2(hash(id + 3.7), hash(id + 9.2)) - 0.5) * 0.7;
  float star = step(0.975, h) * smoothstep(0.2, 0.02, length(fract(g) - 0.5 - off)) * (0.5 + 1.3 * hash(id + 5.3));
  float starMask = uStars * smoothstep(0.85, 0.05, v);
  c += star * starMask * (0.55 + 0.45 * sin(uTime * 1.6 + h * 60.0));

  // 해(또는 달)의 빛무리
  float d = distance(p, sunP);
  float glow = exp(-d * d / (uSunSize * uSunSize)) * 0.8 + exp(-d * 2.6) * 0.2;
  c = 1.0 - (1.0 - c) * (1.0 - uSun * clamp(glow, 0.0, 1.0));
  // 또렷한 원반 (달, 한낮의 해). 0이면 빛무리만 남습니다.
  float disc = uSunDisc > 0.0 ? smoothstep(uSunDisc, uSunDisc * 0.86, d) : 0.0;
  c = mix(c, min(uSun * 1.25, vec3(1.0)), disc);

  // 구름: 가로로 길게 늘인 fbm을 한 번 휘고, 해 쪽으로 한 걸음 옮긴 표본과의 차이로 밝은 면을 만듭니다
  vec2 q = p * vec2(1.5, 3.4) + vec2(uTime * 0.011 + uSeed, uSeed * 0.37);
  vec2 warp = 0.42 * vec2(fbm(q * 0.8 + 3.1), fbm(q * 0.8 + 7.7));
  float n = fbm(q + warp);
  vec2 toSun = normalize(sunP - p + 0.0001) * vec2(1.5, 3.4) * 0.07;
  float n2 = fbm(q + warp + toSun);
  float band = smoothstep(0.18, 0.52, v) * smoothstep(1.08, 0.72, v);
  float cover = uClouds * (0.3 + 0.7 * band);
  float dens = smoothstep(1.0 - cover, 1.0 - cover + 0.3, n);
  float lit = clamp((n - n2) * 4.5 + 0.55, 0.0, 1.0);
  vec3 cloudCol = mix(uShade, uCloud, lit) + uSun * exp(-d * 2.2) * 0.3;
  c = mix(c, cloudCol, dens * 0.9 * (1.0 - disc * 0.6));

  c += (hash(px + uTime) - 0.5) * (2.0 / 255.0); // 띠 현상 방지
  gl_FragColor = vec4(c, 1.0);
}`;

type Palette = { colors: number[][]; sun: number[]; sunPos: [number, number]; sunSize: number; sunDisc: number; cloud: number[]; shade: number[]; clouds: number; stars: number };

function hexToRgb(value: string): number[] {
  const hex = value.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((ch) => ch + ch).join("") : hex;
  return [0, 2, 4].map((n) => parseInt(full.slice(n, n + 2), 16) / 255);
}

function readPalette(el: HTMLElement): Palette {
  const style = getComputedStyle(el);
  const get = (name: string) => style.getPropertyValue(name).trim();
  const num = (name: string, fallback: number) => { const v = parseFloat(get(name)); return Number.isFinite(v) ? v : fallback; };
  return {
    colors: ["--sky-1", "--sky-2", "--sky-3", "--sky-4"].map((name) => hexToRgb(get(name) || "#3647c9")),
    sun: hexToRgb(get("--sun") || "#ffb0d6"),
    sunPos: [num("--sun-x", 50) / 100, num("--sun-y", 60) / 100],
    sunSize: num("--sun-size", 0.34),
    sunDisc: num("--sun-disc", 0),
    cloud: hexToRgb(get("--cloud") || "#ffffff"),
    shade: hexToRgb(get("--cloud-shade") || "#b8a8e0"),
    clouds: num("--clouds", 0.6),
    stars: num("--stars", 0),
  };
}

let rescan: (() => void) | null = null;

export function mountSky() {
  if (rescan) return rescan();
  const root = document.getElementById("sky-root");
  if (!root) return;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
  if (!gl) return;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const U = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    res: U("uRes"), rect: U("uRect"), time: U("uTime"), clouds: U("uClouds"), stars: U("uStars"), sunSize: U("uSunSize"), sunDisc: U("uSunDisc"), unit: U("uUnit"), seed: U("uSeed"),
    c: [U("uC0"), U("uC1"), U("uC2"), U("uC3")], sun: U("uSun"), cloud: U("uCloud"), shade: U("uShade"), sunPos: U("uSunPos"),
  };

  let scale = 0.5;
  const resize = () => {
    scale = Math.min(0.5, 1100 / window.innerWidth);
    canvas.width = Math.max(2, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(2, Math.round(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize);

  let boxes: { el: HTMLElement; palette: Palette; seed: number }[] = [];
  let live: HTMLElement | null = null;
  const scan = () => {
    boxes = [...document.querySelectorAll<HTMLElement>("[data-sky]")].map((el, index) => ({ el, palette: readPalette(el), seed: 3.1 + index * 11.7 }));
    live = null;
  };
  scan();
  rescan = scan;
  document.addEventListener("astro:after-swap", () => { boxes = []; live = null; });

  let cleared = false;
  let last = 0;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 32) return;
    last = now;

    // 화면에 가장 크게 걸친 상자 하나만 그립니다.
    let best: (typeof boxes)[number] | null = null, bestArea = 0, bestRect: DOMRect | null = null;
    for (const box of boxes) {
      const rect = box.el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visible > bestArea) { best = box; bestArea = visible; bestRect = rect; }
    }
    if (live !== (best?.el ?? null)) {
      live?.classList.remove("is-live");
      live = best?.el ?? null;
    }
    if (!best || !bestRect) {
      if (!cleared) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); cleared = true; }
      return;
    }
    cleared = false;

    const { palette } = best;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform4f(u.rect, bestRect.left * scale, bestRect.top * scale, bestRect.width * scale, bestRect.height * scale);
    gl.uniform1f(u.time, now / 1000);
    gl.uniform1f(u.clouds, palette.clouds);
    gl.uniform1f(u.stars, palette.stars);
    gl.uniform1f(u.sunSize, palette.sunSize);
    gl.uniform1f(u.sunDisc, palette.sunDisc);
    gl.uniform1f(u.unit, bestRect.height / window.innerHeight);
    gl.uniform1f(u.seed, best.seed);
    palette.colors.forEach((color, index) => gl.uniform3fv(u.c[index], color));
    gl.uniform3fv(u.sun, palette.sun);
    gl.uniform3fv(u.cloud, palette.cloud);
    gl.uniform3fv(u.shade, palette.shade);
    gl.uniform2f(u.sunPos, palette.sunPos[0], palette.sunPos[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!canvas.isConnected) root.append(canvas);
    best.el.classList.add("is-live"); // 첫 장면이 그려진 뒤에야 CSS 폴백을 끕니다
  };
  requestAnimationFrame(frame);
}
