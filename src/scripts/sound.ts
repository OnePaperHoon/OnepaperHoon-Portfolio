/**
 * 종이 소리. 파일 없이 WebAudio로 합성합니다 (잡음 + 필터 + 짧은 엔벨로프).
 * 기본은 꺼짐. 헤더의 [data-sound-toggle] 버튼이나 터미널의 `sound on`으로 켜고, 선택은 localStorage에 남습니다.
 */
type Name = "flip" | "whoosh" | "crumple" | "turn" | "land" | "key";

const KEY = "onepaperhoon-sound";
let enabled = false;
let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

try { enabled = localStorage.getItem(KEY) === "on"; } catch { /* 저장소를 못 쓰면 꺼진 채로 둡니다 */ }

function ready() {
  if (!context) {
    context = new AudioContext();
    noise = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/** 잡음 한 줄기: 대역 필터의 중심 주파수를 from→to로 쓸면서 짧게 울립니다. */
function swish(at: number, duration: number, from: number, to: number, gain: number, q = 1.2) {
  const ctx = context!;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + duration);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + duration * 0.22);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start(at, Math.random() * 0.8);
  source.stop(at + duration + 0.05);
}

export function play(name: Name) {
  if (!enabled) return;
  let ctx: AudioContext;
  try { ctx = ready(); } catch { return; }
  const now = ctx.currentTime + 0.01;
  if (name === "flip") {
    swish(now, 0.13, 5200, 2600, 0.11, 0.9);
    swish(now + 0.09, 0.1, 3800, 6200, 0.06, 1.1);
  } else if (name === "whoosh") {
    swish(now, 0.62, 380, 2100, 0.2, 0.8);
    swish(now + 0.05, 0.4, 2400, 5200, 0.05, 1.4);
  } else if (name === "turn") {
    swish(now, 0.46, 900, 3600, 0.13, 0.7);
  } else if (name === "land") {
    swish(now, 0.16, 2600, 900, 0.07, 0.8);
  } else if (name === "key") {
    swish(now, 0.035, 2400 + Math.random() * 1200, 1600, 0.035, 2.5);
  } else {
    // 구겨지는 소리: 크기가 제각각인 짧은 바스락을 여러 번
    for (let i = 0; i < 16; i++) swish(now + i * 0.03 + Math.random() * 0.025, 0.03 + Math.random() * 0.05, 2200 + Math.random() * 5200, 1500 + Math.random() * 2500, 0.05 + Math.random() * 0.1, 1.6);
  }
}

export const soundEnabled = () => enabled;

export function setSound(on: boolean) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* 무시 */ }
  syncToggles();
  if (on) play("flip");
}

function syncToggles() {
  for (const button of document.querySelectorAll<HTMLElement>("[data-sound-toggle]")) {
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "소리 끄기" : "소리 켜기");
  }
}

let bound = false;
/** 헤더는 페이지마다 새로 그려지므로 클릭은 문서에 한 번만 걸고, 버튼 상태만 페이지마다 맞춥니다. */
export function mountSound() {
  syncToggles();
  if (bound) return;
  bound = true;
  document.addEventListener("click", (event) => {
    if ((event.target as Element | null)?.closest?.("[data-sound-toggle]")) setSound(!enabled);
  });
}
