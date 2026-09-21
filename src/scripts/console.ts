/**
 * 터미널 모드. ` 키(또는 헤더의 >_ 버튼)로 여는 작은 콘솔입니다.
 * 패널은 #term-root(transition:persist) 안에 살아서 페이지를 옮겨도 기록이 남습니다.
 * 작업·노트 목록은 Base.astro가 심어 둔 #site-index JSON에서 읽습니다.
 */
import { navigate } from "astro:transitions/client";
import { play, setSound, soundEnabled } from "./sound";

type Work = { id: string; title: string; kind: string; status: string; summary: string; paper: string; links: Record<string, string | undefined> };
type Note = { id: string; title: string; date: string; summary: string };
type Index = { author: string; email: string; github: string; works: Work[]; notes: Note[] };

const PHASES = ["dawn", "day", "dusk", "night"];
const COMMANDS = ["help", "ls", "open", "cat", "throw", "now", "sound", "whoami", "contact", "github", "clear", "exit"];
const HELP = [
  "ls [work|notes]      목록",
  "open <이름>          그 작업·노트로 이동   (open feedline)",
  "cat <이름>           요약과 원칙 한 줄",
  "throw                지금 접혀 있는 종이를 날리기",
  "now <dawn|day|dusk|night|auto>   하늘의 시간대",
  "sound <on|off>       종이 소리",
  "whoami · contact · github",
  "clear · exit         (Esc로도 닫힙니다)",
];

let index: Index | null = null;
let panel: HTMLElement | null = null;
let log: HTMLElement;
let input: HTMLInputElement;
let lastFocus: HTMLElement | null = null;
const history: string[] = [];
let cursor = 0;

function readIndex(): Index {
  index ??= JSON.parse(document.getElementById("site-index")?.textContent ?? "{}") as Index;
  return index;
}

function line(text: string, kind: "out" | "in" | "err" | "dim" = "out") {
  const row = document.createElement("div");
  row.className = `term__line term__line--${kind}`;
  row.textContent = text;
  log.append(row);
  log.scrollTop = log.scrollHeight;
}

function find(name: string) {
  const { works, notes } = readIndex();
  const key = name.toLowerCase().replace(/^(work|notes)\//, "");
  const work = works.find((w) => w.id === key || w.title.toLowerCase() === key) ?? works.find((w) => w.id.startsWith(key) || w.title.toLowerCase().startsWith(key));
  if (work) return { type: "work" as const, work };
  const note = notes.find((n) => n.id === key) ?? notes.find((n) => n.id.startsWith(key));
  return note ? { type: "note" as const, note } : null;
}

function run(raw: string) {
  const [command = "", ...args] = raw.trim().split(/\s+/);
  const arg = args.join(" ");
  const site = readIndex();
  switch (command.toLowerCase()) {
    case "":
      return;
    case "help":
      return HELP.forEach((text) => line(text));
    case "ls": {
      if (arg && !["work", "works", "notes"].includes(arg)) return line(`ls: ${arg}: 그런 목록은 없습니다 (work, notes)`, "err");
      if (arg !== "notes") {
        line("work/", "dim");
        site.works.forEach((w) => line(`  ${w.id.padEnd(20)} ${w.status.padEnd(8)} ${w.kind}`));
      }
      if (arg !== "work" && arg !== "works") {
        line("notes/", "dim");
        site.notes.forEach((n) => line(`  ${n.id.padEnd(28)} ${n.date}`));
      }
      return;
    }
    case "open":
    case "cd": {
      if (!arg || arg === "~" || arg === "/") { close(); return void navigate("/"); }
      if (arg === "notes" || arg === "work") { close(); return void navigate(arg === "notes" ? "/notes" : "/#work"); }
      const hit = find(arg);
      if (!hit) return line(`open: ${arg}: 찾을 수 없습니다 — ls 로 이름을 확인하세요`, "err");
      close();
      return void navigate(hit.type === "work" ? `/work/${hit.work.id}` : `/notes/${hit.note.id}`);
    }
    case "cat": {
      const hit = arg ? find(arg) : null;
      if (!hit) return line(arg ? `cat: ${arg}: 찾을 수 없습니다` : "cat: 이름이 필요합니다 (cat yenwatch)", "err");
      if (hit.type === "note") { line(hit.note.title); return line(hit.note.summary, "dim"); }
      line(`${hit.work.title} — ${hit.work.kind}`);
      line(hit.work.summary, "dim");
      line(`“${hit.work.paper}”`);
      Object.entries(hit.work.links).forEach(([name, url]) => url && line(`  ${name.padEnd(5)} ${url}`, "dim"));
      return;
    }
    case "throw": {
      let answered = false;
      document.dispatchEvent(new CustomEvent("paper:throw", { detail: { done: (ok: boolean) => { answered = true; line(ok ? "날렸습니다 ✈" : "지금은 던질 종이가 없습니다. 맨 아래(또는 404)에서 접힌 종이를 찾아보세요.", ok ? "out" : "err"); } } }));
      if (!answered) line("종이가 아직 준비되지 않았습니다.", "err");
      return;
    }
    case "now": {
      if (![...PHASES, "auto"].includes(arg)) return line("now: dawn | day | dusk | night | auto", "err");
      try { arg === "auto" ? sessionStorage.removeItem("now") : sessionStorage.setItem("now", arg); } catch { /* 무시 */ }
      document.dispatchEvent(new CustomEvent("sky:now"));
      return line(arg === "auto" ? "하늘을 지금 시각에 맞췄습니다." : `하늘을 ${arg} 로 바꿨습니다.`);
    }
    case "sound": {
      if (arg !== "on" && arg !== "off") return line(`sound: 지금은 ${soundEnabled() ? "on" : "off"} — sound on | off`);
      setSound(arg === "on");
      return line(`소리 ${arg}`);
    }
    case "whoami":
      line(`${site.author} (onepaperhoon)`);
      return line("흩어진 정보와 기다림을, 믿을 수 있는 상태와 조용한 신호로 바꾸는 서비스를 만듭니다.", "dim");
    case "contact":
    case "mail":
      return line(site.email);
    case "github":
      return line(site.github);
    case "clear":
      return void log.replaceChildren();
    case "exit":
    case "quit":
      return close();
    case "sudo":
      return line("권한이 없습니다. 한 장 더 써 오세요.", "err");
    case "rm":
      return line("종이는 지우는 게 아니라 접는 겁니다.", "err");
    default:
      return line(`${command}: 그런 명령은 없습니다 — help 를 쳐 보세요`, "err");
  }
}

function complete(value: string) {
  const parts = value.split(/\s+/);
  const site = readIndex();
  if (parts.length <= 1) return COMMANDS.filter((c) => c.startsWith(parts[0] ?? ""));
  const pool = ["open", "cd", "cat"].includes(parts[0]) ? [...site.works.map((w) => w.id), ...site.notes.map((n) => n.id)]
    : parts[0] === "now" ? [...PHASES, "auto"] : parts[0] === "sound" ? ["on", "off"] : parts[0] === "ls" ? ["work", "notes"] : [];
  return pool.filter((c) => c.startsWith(parts[1] ?? "")).map((c) => `${parts[0]} ${c}`);
}

function build(root: HTMLElement) {
  panel = document.createElement("section");
  panel.className = "term";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "터미널");
  panel.hidden = true;
  panel.innerHTML = `
    <header class="term__bar"><span class="term__dots"><i></i><i></i><i></i></span><span class="term__title">onepaperhoon — zsh</span><button class="term__close" type="button" aria-label="터미널 닫기">esc</button></header>
    <div class="term__log" aria-live="polite"></div>
    <label class="term__prompt"><span aria-hidden="true">~ ❯</span><input class="term__input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="명령 입력" /></label>`;
  root.append(panel);
  log = panel.querySelector(".term__log")!;
  input = panel.querySelector(".term__input")!;
  panel.querySelector(".term__close")!.addEventListener("click", close);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const value = input.value;
      line(`~ ❯ ${value}`, "in");
      if (value.trim()) { history.push(value); cursor = history.length; }
      input.value = "";
      run(value);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      cursor = Math.min(history.length, Math.max(0, cursor + (event.key === "ArrowUp" ? -1 : 1)));
      input.value = history[cursor] ?? "";
    } else if (event.key === "Tab") {
      event.preventDefault();
      const options = complete(input.value);
      if (options.length === 1) input.value = `${options[0]} `;
      else if (options.length > 1) line(options.map((o) => o.split(" ").pop()).join("   "), "dim");
    } else if (event.key.length === 1) {
      play("key");
    }
  });
}

function open() {
  if (!panel) return;
  lastFocus = document.activeElement as HTMLElement | null;
  panel.hidden = false;
  document.documentElement.classList.add("term-open");
  if (!log.childElementCount) {
    line("onepaperhoon 터미널. help 를 치면 할 수 있는 일이 나옵니다.", "dim");
  }
  input.focus();
}

function close() {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  document.documentElement.classList.remove("term-open");
  lastFocus?.focus?.();
}

let bound = false;
export function mountConsole() {
  index = null; // 페이지마다 같은 내용이지만, 새 빌드로 바뀌었을 수 있으니 다시 읽습니다
  const root = document.getElementById("term-root");
  if (!root) return;
  if (!root.querySelector(".term")) build(root);
  if (bound) return;
  bound = true;
  document.addEventListener("keydown", (event) => {
    const typing = (event.target as Element | null)?.closest?.("input, textarea, [contenteditable]");
    if (event.code === "Backquote" && !event.ctrlKey && !event.metaKey && !event.altKey && (!typing || typing === input)) {
      event.preventDefault();
      panel?.hidden ? open() : close();
    } else if (event.key === "Escape") close();
  });
  document.addEventListener("click", (event) => {
    if ((event.target as Element | null)?.closest?.("[data-term-toggle]")) panel?.hidden ? open() : close();
  });
}
