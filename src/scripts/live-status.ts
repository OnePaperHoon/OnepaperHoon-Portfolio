/**
 * 빌드 때 심어 둔 서비스 상태 문구를, 가능하면 지금 값으로 바꿉니다.
 * 실패하면(오프라인, CORS 차단, 서비스 다운 등) 아무것도 건드리지 않아 "배포 시점 기준" 표시가 그대로 남습니다.
 *
 * - `[data-live="<id>"]` 요소: 문구 하나짜리 (홈 Always on 목록의 <em>)
 * - `[data-paper-slot][data-live]`: 종이. data-live 는 쉼표로 이은 id 목록, data-live-template 은 `{id}` 자리를 둔 본문,
 *   data-live-lines 는 빌드 때 받은 줄(JSON)입니다. 새 값을 받은 서비스만 갈아 끼워 다시 인쇄합니다.
 */
import { fetchLiveStatusInBrowser, type LiveStatus } from "@/lib/live";

const isEn = () => document.documentElement.lang === "en";
function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const en = isEn();
  if (Number.isNaN(minutes) || minutes < 1) return en ? "checked just now" : "방금 점검";
  if (minutes < 60) return en ? `checked ${minutes} min ago` : `${minutes}분 전 점검`;
  return en ? `checked ${Math.round(minutes / 60)} h ago` : `${Math.round(minutes / 60)}시간 전 점검`;
}
const text = (status: LiveStatus) => (isEn() ? status.lineEn : status.line);

const cache = new Map<string, Promise<LiveStatus | null>>();
const load = (id: string) => {
  if (!cache.has(id)) cache.set(id, fetchLiveStatusInBrowser(id));
  return cache.get(id)!;
};

const render = (template: string, lines: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, id: string) => lines[id] ?? "");

export async function mountLiveStatus() {
  const targets = [...document.querySelectorAll<HTMLElement>("[data-live]")];
  if (!targets.length) return;
  const ids = [...new Set(targets.flatMap((t) => (t.dataset.live ?? "").split(",").map((s) => s.trim()).filter(Boolean)))];
  const fresh = Object.fromEntries((await Promise.all(ids.map(async (id) => [id, await load(id)] as const))).filter(([, s]) => s)) as Record<string, LiveStatus>;
  if (!Object.keys(fresh).length) return;

  let touched = false;
  for (const target of targets) {
    if (target.hasAttribute("data-paper-slot")) {
      const template = target.dataset.liveTemplate;
      if (!template) continue;
      let lines: Record<string, string> = {};
      try {
        lines = JSON.parse(target.dataset.liveLines ?? "{}");
      } catch {
        lines = {};
      }
      const got = (target.dataset.live ?? "").split(",").map((s) => s.trim()).filter((id) => fresh[id]);
      if (!got.length) continue;
      for (const id of got) lines[id] = text(fresh[id]);
      const latest = got.map((id) => fresh[id].checkedAt).sort().at(-1)!;
      // 종이에 인쇄되는 문구와, 종이가 없을 때 보이는 CSS 카드 양쪽을 고칩니다.
      target.dataset.liveLines = JSON.stringify(lines);
      target.dataset.body = render(template, lines);
      target.dataset.foot = `${(target.dataset.foot ?? "").split(" · ")[0]} · ${ago(latest)}`;
      const body = target.querySelector(".paper-card__body");
      if (body) body.textContent = target.dataset.body;
      const foot = target.querySelector(".paper-card__foot span");
      if (foot) foot.textContent = target.dataset.foot;
      touched = true;
    } else {
      const status = fresh[target.dataset.live ?? ""];
      if (!status) continue;
      target.textContent = `${text(status)} · ${ago(status.checkedAt)}`;
      target.classList.add("is-live");
    }
  }
  if (touched) document.dispatchEvent(new Event("paper:rescan"));
}
