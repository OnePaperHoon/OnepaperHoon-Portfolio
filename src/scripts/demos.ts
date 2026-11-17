/**
 * 만져볼 수 있는 케이스 스터디. 상세 페이지의 [data-demo] 상자 안에 작은 데모를 세웁니다.
 *  - cca-init / cda-init : 설치 CLI의 대화형 흐름(충돌 처리 → 이벤트 선택 → diff → 적용)을 직접 진행
 *  - yen-board           : "매분 새 알림" 대 "메시지 하나를 계속 수정"을 나란히
 *  - roulette            : Build a ___ for ___ 슬롯
 * 내용은 각 저장소 README의 동작을 재현한 것이고, 실제 도구를 실행하지는 않습니다.
 */
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------- 설치 CLI 리플레이
type Tool = {
  command: string; config: string; existing: string; dispatcher: string; backups: string;
  events: { name: string; on: boolean; note?: string }[];
  extras: string[]; toast: string; trust?: string;
};
const TOOLS: Record<string, Tool> = {
  "cca-init": {
    command: "cca init", config: "~/.claude/settings.json", existing: "Stop → ~/scripts/my-notify.sh", dispatcher: "~/.claude/scripts/cca.{ps1,sh}", backups: "~/.claude/cca-backups/",
    events: [{ name: "Stop", on: true }, { name: "Notification", on: true }, { name: "SessionEnd", on: false }],
    extras: ["슬래시 커맨드 /cca-off, /cca-on 설치 → ~/.claude/commands/"],
    toast: "Claude Code · 작업이 끝났습니다",
  },
  "cda-init": {
    command: "cda init", config: "~/.codex/hooks.json", existing: "Stop → ~/scripts/my-notify.sh", dispatcher: "~/.codex/scripts/cda.{ps1,sh}", backups: "~/.codex/cda-backups/",
    events: [{ name: "Stop", on: true }, { name: "PermissionRequest", on: true }, { name: "SubagentStop", on: false }, { name: "PreToolUse", on: false, note: "matcher: Bash|apply_patch" }],
    extras: ["스킬 cda-off, cda-on 설치 → ~/.codex/skills/"],
    toast: "Codex · 한 턴이 끝났습니다",
    trust: "Codex는 새 hook을 trust 하기 전까지 발화시키지 않습니다. codex 를 열고 /hooks → cda → trust",
  },
};

function mountInit(stage: HTMLElement, tool: Tool) {
  stage.replaceChildren();
  const screen = el("div", "replay");
  const log = el("div", "replay__log");
  const ask = el("div", "replay__ask");
  screen.append(log, ask);
  stage.append(screen);
  let run = 0;

  const say = (text: string, kind = "") => { const row = el("div", `replay__line ${kind}`, text); log.append(row); log.scrollTop = log.scrollHeight; return row; };
  const choose = (question: string, options: { label: string; hint?: string; primary?: boolean }[]) => new Promise<number>((resolve) => {
    ask.replaceChildren(el("p", "replay__q", question));
    const row = el("div", "replay__options");
    options.forEach((option, index) => {
      const button = el("button", `replay__option${option.primary ? " is-primary" : ""}`, option.label);
      button.type = "button";
      if (option.hint) button.append(el("small", "", option.hint));
      button.addEventListener("click", () => { ask.replaceChildren(); say(`❯ ${option.label}`, "is-in"); resolve(index); });
      row.append(button);
    });
    ask.append(row);
  });

  const play = async () => {
    const id = ++run;
    log.replaceChildren();
    ask.replaceChildren();
    const typed = say("$ ", "is-in");
    for (const ch of tool.command) { if (id !== run) return; typed.textContent += ch; await sleep(reduced() ? 0 : 45); }
    await sleep(350);
    say(`${tool.config} 을 읽는 중…`, "is-dim");
    await sleep(500);
    say(`기존 hook 1개 발견   ${tool.existing}`);
    const conflict = await choose("같은 이벤트에 이미 hook이 있습니다. 어떻게 할까요?", [
      { label: "Append", hint: "둘 다 울림 (기본)", primary: true }, { label: "Skip", hint: "기존 것만 유지" }, { label: "Abort", hint: "아무것도 안 함" },
    ]);
    if (id !== run) return;
    if (conflict === 2) {
      say("아무것도 바꾸지 않고 종료했습니다.", "is-dim");
      return void restart("처음부터 다시");
    }

    // 이벤트 선택
    const picked = new Map(tool.events.map((event) => [event.name, event.on]));
    await new Promise<void>((resolve) => {
      ask.replaceChildren(el("p", "replay__q", "알림 받을 이벤트를 고르세요"));
      const row = el("div", "replay__options");
      for (const event of tool.events) {
        const toggle = el("button", "replay__option replay__check", event.name);
        toggle.type = "button";
        toggle.setAttribute("aria-pressed", String(event.on));
        if (event.note) toggle.append(el("small", "", event.note));
        toggle.addEventListener("click", () => { picked.set(event.name, !picked.get(event.name)); toggle.setAttribute("aria-pressed", String(picked.get(event.name))); });
        row.append(toggle);
      }
      const next = el("button", "replay__option is-primary", "다음");
      next.type = "button";
      next.addEventListener("click", () => resolve());
      row.append(next);
      ask.append(row);
    });
    if (id !== run) return;
    const names = tool.events.filter((event) => picked.get(event.name));
    ask.replaceChildren();
    say(`❯ ${names.map((event) => event.name).join(", ") || "(선택 없음)"}`, "is-in");
    if (!names.length) { say("선택한 이벤트가 없어 바꿀 것이 없습니다.", "is-dim"); return void restart("처음부터 다시"); }

    // diff 미리보기
    await sleep(300);
    say(`변경 미리보기 — ${tool.config}`, "is-dim");
    let added = 0;
    for (const event of names) {
      const clash = event.name === "Stop";
      if (clash && conflict === 1) { say(`  ${event.name.padEnd(18)} 기존 hook 유지 (건너뜀)`, "is-dim"); continue; }
      added += 1;
      say(`+ "${event.name}": { "command": "${tool.dispatcher.replace("{ps1,sh}", "sh")} ${event.name}" }${clash ? "   ← 기존 hook 옆에 추가" : ""}`, "is-add");
      if (event.note) say(`+   ${event.note}`, "is-add");
    }
    const apply = await choose("이대로 적용할까요? 확인하기 전에는 아무것도 쓰지 않습니다.", [{ label: "적용", primary: true }, { label: "취소" }]);
    if (id !== run) return;
    if (apply === 1) { say("취소했습니다. 파일은 그대로입니다.", "is-dim"); return void restart("처음부터 다시"); }

    for (const text of [`백업 → ${tool.backups} (최근 3개 유지)`, `dispatcher 설치 → ${tool.dispatcher}`, `hook ${added}개 등록`, ...tool.extras]) { await sleep(260); if (id !== run) return; say(`✓ ${text}`, "is-ok"); }
    if (tool.trust) { await sleep(300); say(`! ${tool.trust}`, "is-warn"); }

    // 알림 받아보기
    ask.replaceChildren(el("p", "replay__q", tool.trust ? "trust 를 하기 전에는 알림이 오지 않습니다." : "설치가 끝났습니다. 긴 작업이 끝난 순간을 흉내 내 볼까요?"));
    const row = el("div", "replay__options");
    const ring = el("button", "replay__option is-primary", "알림 받아보기");
    ring.type = "button";
    let trusted = !tool.trust;
    ring.disabled = !trusted;
    ring.addEventListener("click", () => toast(stage, tool.toast));
    if (tool.trust) {
      const trust = el("button", "replay__option", "/hooks → trust");
      trust.type = "button";
      trust.addEventListener("click", () => { trusted = true; ring.disabled = false; trust.remove(); say("❯ /hooks → cda → trust", "is-in"); say("✓ 이제 hook이 발화합니다", "is-ok"); });
      row.append(trust);
    }
    const again = el("button", "replay__option", "처음부터");
    again.type = "button";
    again.addEventListener("click", play);
    row.append(ring, again);
    ask.append(row);
  };
  const restart = (label: string) => {
    const button = el("button", "replay__option", label);
    button.type = "button";
    button.addEventListener("click", play);
    const row = el("div", "replay__options");
    row.append(button);
    ask.replaceChildren(row);
  };
  whenVisible(stage, play);
}

function toast(stage: HTMLElement, title: string) {
  stage.querySelector(".os-toast")?.remove();
  const box = el("div", "os-toast");
  box.setAttribute("role", "status");
  box.append(el("strong", "", title), el("span", "", "방금 · Stop"));
  stage.append(box);
  setTimeout(() => box.classList.add("is-leaving"), 3200);
  setTimeout(() => box.remove(), 3800);
}

// ---------------------------------------------------------------- YenWatch: 도배 vs 메시지 하나
function mountYen(stage: HTMLElement) {
  stage.replaceChildren();
  const board = el("div", "yen");
  const makeChat = (name: string, caption: string) => {
    const chat = el("div", "chat");
    const head = el("header", "chat__head");
    const badge = el("b", "chat__badge", "0");
    head.append(el("span", "", `# ${name}`), badge);
    const list = el("div", "chat__list");
    chat.append(head, list, el("p", "chat__caption", caption));
    return { chat, list, badge };
  };
  const noisy = makeChat("환율-알림", "매분 새 메시지를 보내는 방식");
  const calm = makeChat("환율", "YenWatch: 메시지 하나를 계속 수정");
  const tally = el("p", "yen__tally");
  const reset = el("button", "replay__option", "다시");
  reset.type = "button";
  const foot = el("div", "yen__foot");
  foot.append(tally, reset);
  board.append(noisy.chat, calm.chat);
  stage.append(board, foot);

  let minute = 0, rate = 946.32, open = 946.32, high = rate, low = rate, pings = 0, alerted = false, status: HTMLElement | null = null;
  const clock = () => `오후 ${2 + Math.floor((10 + minute) / 60)}:${String((10 + minute) % 60).padStart(2, "0")}`;
  const message = (body: string, className = "") => {
    const item = el("div", `msg ${className}`);
    item.append(el("i", "msg__avatar", "¥"));
    const text = el("div", "msg__body");
    text.append(el("strong", "", "YenWatch"), el("time", "", clock()), el("p", "", body));
    item.append(text);
    return item;
  };
  const start = () => {
    minute = 0; rate = open = high = low = 946.32; pings = 0; alerted = false; status = null;
    noisy.list.replaceChildren(); calm.list.replaceChildren();
    tick();
  };
  const tick = () => {
    minute += 1;
    rate += (alerted ? 0.55 : -0.95) + (Math.random() - 0.5) * 1.1;
    high = Math.max(high, rate); low = Math.min(low, rate);
    const change = rate - open, arrow = change > 0.005 ? "▲" : change < -0.005 ? "▼" : "―";
    const lineText = `100 JPY = ${rate.toFixed(2)} KRW`;

    noisy.list.append(message(lineText));
    while (noisy.list.childElementCount > 5) noisy.list.firstElementChild?.remove();
    noisy.badge.textContent = String(minute);
    noisy.badge.classList.add("is-on");

    const body = `${lineText}  ${arrow} ${Math.abs(change).toFixed(2)} (${((change / open) * 100).toFixed(2)}%)\n오늘 범위  ${low.toFixed(2)} ~ ${high.toFixed(2)} KRW`;
    if (!status) { status = message(body, "msg--status"); calm.list.append(status); }
    else { status.querySelector("p")!.textContent = body; status.querySelector("time")!.textContent = `${clock()} (수정됨)`; status.classList.remove("is-fresh"); void status.offsetWidth; status.classList.add("is-fresh"); }
    if (!alerted && rate <= 940) {
      alerted = true; pings += 1;
      calm.list.append(message(`@나  💸 환전 타이밍입니다\n목표 940.00 KRW 이하 → 현재 ${rate.toFixed(2)} KRW`, "msg--alert"));
      calm.badge.textContent = "1";
      calm.badge.classList.add("is-on");
    }
    tally.textContent = `${minute}분 경과 — 왼쪽 알림 ${minute}개 · 오른쪽 알림 ${pings}개${alerted ? " (목표가에 닿은 순간 한 번)" : ""}`;
  };
  reset.addEventListener("click", start);

  let timer = 0;
  new IntersectionObserver(([entry]) => {
    window.clearInterval(timer);
    if (!entry.isIntersecting) return;
    if (!minute) start();
    if (!reduced()) timer = window.setInterval(() => { if (stage.isConnected && minute < 40) tick(); else window.clearInterval(timer); }, 1300);
  }, { threshold: 0.35 }).observe(stage);
}

// ---------------------------------------------------------------- Roulette Side 미니 슬롯
const BUILD = ["미니 게임", "한 페이지 도구", "제너레이터", "위젯", "기술 데모·실험", "자동화 스크립트", "CLI 도구", "크롬 확장프로그램", "웹사이트", "모바일 앱", "데스크톱 앱", "챗봇·메신저 봇", "키오스크·태블릿 앱"];
const FOR = ["웹 운영자", "타투이스트", "반려동물 미용사", "주부", "대학생", "취업준비생", "은퇴자", "1인 자영업자"];
const USING = ["지도·지리", "3D·WebGL", "데이터 시각화·차트", "이미지 처리·필터", "오디오 합성·분석", "OCR·문서 인식", "LLM·생성 AI", "카메라·QR/바코드", "실시간 동기화·협업", "웹 스크래핑·자동화", "캘린더·일정·반복규칙", "PDF·인쇄물 생성"];

function mountRoulette(stage: HTMLElement) {
  stage.replaceChildren();
  const box = el("div", "slot");
  const reel = (label: string) => { const row = el("div", "slot__row"); const value = el("strong", "slot__value", "?"); row.append(el("span", "slot__label", label), value); return { row, value }; };
  const a = reel("Build a"), b = reel("for"), c = reel("using");
  c.row.hidden = true;
  const controls = el("div", "slot__controls");
  const using = el("label", "slot__using");
  const check = el("input");
  check.type = "checkbox";
  using.append(check, document.createTextNode(" using — 기술 카테고리 추가"));
  const spin = el("button", "slot__spin", "돌리기");
  spin.type = "button";
  controls.append(using, spin);
  box.append(a.row, b.row, c.row, controls);
  stage.append(box);
  check.addEventListener("change", () => { c.row.hidden = !check.checked; });

  let spinning = false;
  const roll = async (target: HTMLElement, pool: string[], ms: number) => {
    const end = performance.now() + (reduced() ? 0 : ms);
    target.classList.add("is-rolling");
    while (performance.now() < end) { target.textContent = pool[Math.floor(Math.random() * pool.length)]; await sleep(55); }
    target.textContent = pool[Math.floor(Math.random() * pool.length)];
    target.classList.remove("is-rolling");
  };
  spin.addEventListener("click", async () => {
    if (spinning) return;
    spinning = true;
    await Promise.all([roll(a.value, BUILD, 700), roll(b.value, FOR, 1150), check.checked ? roll(c.value, USING, 1600) : null]);
    spinning = false;
  });
}

// ----------------------------------------------------------------
// ---------------------------------------------------------------- 소복: 실제 서비스를 고정 자료로 연다
function mountSobok(stage: HTMLElement) {
  stage.replaceChildren();
  const frame = el("div", "embed");
  const iframe = document.createElement("iframe");
  iframe.title = "소복 — 2024년 11월 수도권 폭설 재현";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "fullscreen";
  const src = "https://sobok.onepaperhoon.com/?fixture=2024112712&t=2024112806";
  const open = el("a", "replay__option is-primary", "새 창에서 크게 보기 ↗") as unknown as HTMLAnchorElement;
  open.href = src; open.target = "_blank"; open.rel = "noreferrer";
  const foot = el("div", "yen__foot");
  foot.append(el("p", "yen__tally", "3D 지도는 WebGL 을 쓰므로 모바일에서는 무거울 수 있습니다."), open);
  frame.append(iframe);
  stage.append(frame, foot);
  // 보일 때 비로소 싣는다. 무거운 WebGL 앱을 페이지 로드 때부터 돌리지 않기 위해.
  whenVisible(stage, () => { iframe.src = src; });
}

// ---------------------------------------------------------------- Lyrcing: 가사가 별자리가 되는 화면 (Canvas 2D)
const LYRIC_LINES = [
  "한 장에서 시작해", "매일 돌아가는 서비스로", "흩어진 정보와", "끝없는 기다림을", "믿을 수 있는 상태와", "조용한 신호로",
];
function mountLyrcing(stage: HTMLElement) {
  stage.replaceChildren();
  const canvas = document.createElement("canvas");
  canvas.className = "lyric-sky";
  canvas.setAttribute("aria-label", "가사 별자리 데모");
  const foot = el("div", "yen__foot");
  const caption = el("p", "yen__tally", "");
  const replay = el("button", "replay__option", "다시");
  replay.type = "button";
  foot.append(caption, replay);
  stage.append(canvas, foot);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  type Star = { x: number; y: number; word: string; born: number; line: number };
  const BPM = 92, beat = 60000 / BPM;
  let stars: Star[] = [], line = 0, word = 0, lastBeat = 0, raf = 0, start = 0, running = false;
  let size = { w: 0, h: 0, dpr: 1 };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    size = { w: rect.width, h: rect.height, dpr: Math.min(2, window.devicePixelRatio || 1) };
    canvas.width = size.w * size.dpr; canvas.height = size.h * size.dpr;
  };
  const rnd = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const place = (lineIndex: number, wordIndex: number, count: number): [number, number] => {
    // 한 줄은 하늘을 가로지르는 느슨한 호. 줄마다 높이가 다르다.
    const t = (wordIndex + 0.5) / count;
    const x = size.w * (0.1 + 0.8 * t) + (rnd(lineIndex * 7 + wordIndex) - 0.5) * size.w * 0.06;
    const y = size.h * (0.22 + 0.56 * rnd(lineIndex * 13 + 1)) + Math.sin(t * Math.PI) * -size.h * 0.12 + (rnd(lineIndex * 3 + wordIndex * 5) - 0.5) * size.h * 0.1;
    return [x, y];
  };
  const tick = (now: number) => {
    if (!running) return;
    if (!start) { start = now; lastBeat = now - beat; }
    if (now - lastBeat >= beat) {
      lastBeat += beat;
      const words = LYRIC_LINES[line].split(" ");
      if (word < words.length) {
        const [x, y] = place(line, word, words.length);
        stars.push({ x, y, word: words[word], born: now, line });
        word += 1;
      } else {
        line += 1; word = 0;
        if (line >= LYRIC_LINES.length) { line = 0; stars = stars.filter((s) => now - s.born < beat * 4); }
      }
      caption.textContent = `${BPM} BPM · ${LYRIC_LINES[line]}`;
    }
    draw(now);
    raf = requestAnimationFrame(tick);
  };
  const draw = (now: number) => {
    const { w, h, dpr } = size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0b0a1c"); sky.addColorStop(1, "#1d1b3f");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // 배경 별
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 70; i++) { const tw = 0.6 + 0.4 * Math.sin(now / 900 + i); ctx.globalAlpha = 0.25 * tw; ctx.beginPath(); ctx.arc(rnd(i) * w, rnd(i + 100) * h, 1 + rnd(i + 200), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const pulse = 1 - ((now - lastBeat) % beat) / beat;
    // 줄마다 선으로 잇는다. 끝난 줄은 서서히 사라진다.
    const byLine = new Map<number, Star[]>();
    for (const s of stars) byLine.set(s.line, [...(byLine.get(s.line) ?? []), s]);
    for (const [index, group] of byLine) {
      const age = now - group[group.length - 1].born, fade = index === line ? 1 : Math.max(0, 1 - age / (beat * 6));
      if (fade <= 0) continue;
      ctx.strokeStyle = `rgba(190, 200, 255, ${0.35 * fade})`; ctx.lineWidth = 1;
      ctx.beginPath(); group.forEach((s, i) => (i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y))); ctx.stroke();
      for (const s of group) {
        const grow = Math.min(1, (now - s.born) / 260), r = (3 + 4 * grow) * (s === stars[stars.length - 1] ? 1 + pulse * 0.5 : 1);
        ctx.fillStyle = `rgba(255, 244, 200, ${fade})`;
        ctx.shadowColor = "rgba(255, 220, 140, 0.9)"; ctx.shadowBlur = 14 * grow;
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = `700 ${Math.max(13, Math.min(22, w / 32))}px ${getComputedStyle(document.body).fontFamily}`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = `rgba(255,255,255,${0.92 * fade * grow})`;
        ctx.fillText(s.word, s.x, s.y + r + 6);
      }
    }
    stars = stars.filter((s) => s.line === line || now - s.born < beat * 10);
  };
  const reset = () => { stars = []; line = 0; word = 0; start = 0; };
  replay.addEventListener("click", reset);
  const ro = new ResizeObserver(() => { resize(); if (!running) draw(performance.now()); });
  ro.observe(canvas);
  resize();
  if (reduced()) {
    // 동작 줄이기: 첫 두 줄을 한 번에 그려 둔다.
    LYRIC_LINES.slice(0, 2).forEach((l, li) => l.split(" ").forEach((wd, wi, arr) => { const [x, y] = place(li, wi, arr.length); stars.push({ x, y, word: wd, born: 0, line: li }); }));
    line = 1; lastBeat = 0; draw(performance.now());
    caption.textContent = "동작 줄이기가 켜져 있어 멈춘 화면으로 보여 줍니다.";
    return;
  }
  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting && stage.isConnected;
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(tick);
  }, { threshold: 0.3 }).observe(stage);
}

function whenVisible(target: HTMLElement, run: () => void) {
  const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); run(); } }, { threshold: 0.4 });
  observer.observe(target);
}

export function mountDemos() {
  for (const box of document.querySelectorAll<HTMLElement>("[data-demo]:not([data-demo-ready])")) {
    box.dataset.demoReady = "";
    const stage = box.querySelector<HTMLElement>("[data-demo-stage]");
    const name = box.dataset.demo ?? "";
    if (!stage) continue;
    if (TOOLS[name]) mountInit(stage, TOOLS[name]);
    else if (name === "yen-board") mountYen(stage);
    else if (name === "roulette") mountRoulette(stage);
    else if (name === "sobok-replay") mountSobok(stage);
    else if (name === "lyrcing-sky") mountLyrcing(stage);
  }
}
