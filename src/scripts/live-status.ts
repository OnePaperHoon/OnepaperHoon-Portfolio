/**
 * 빌드 때 심어 둔 FeedLine 상태 숫자를, 가능하면 지금 값으로 바꿉니다.
 * 실패하면(오프라인, CORS 차단 등) 아무것도 건드리지 않아 "배포 시점 기준" 표시가 그대로 남습니다.
 */
import { FEEDLINE_BROWSER_FETCH, FEEDLINE_STATUS_URLS, feedlineLine, parseFeedlineStatus, type FeedlineStatus } from "@/lib/feedline";

function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "방금 점검";
  if (minutes < 60) return `${minutes}분 전 점검`;
  return `${Math.round(minutes / 60)}시간 전 점검`;
}

let cached: FeedlineStatus | null = null;

async function load() {
  if (cached) return cached;
  for (const url of FEEDLINE_STATUS_URLS) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
      if (!response.ok) continue;
      cached = parseFeedlineStatus(await response.json());
      if (cached) return cached;
    } catch {
      // 다음 주소로
    }
  }
  return null;
}

export async function mountLiveStatus() {
  const targets = [...document.querySelectorAll<HTMLElement>("[data-live='feedline']")];
  if (!targets.length || !FEEDLINE_BROWSER_FETCH) return;
  const status = await load();
  if (!status) return;
  const line = feedlineLine(status), when = ago(status.checkedAt);
  for (const target of targets) {
    if (target.hasAttribute("data-paper-slot")) {
      // 종이에 인쇄되는 문구와, 종이가 없을 때 보이는 CSS 카드 양쪽을 고칩니다.
      const swap = (text: string) => text.replace(/소스 \d+\/\d+ 정상/, line);
      target.dataset.body = swap(target.dataset.body ?? "");
      target.dataset.foot = `${(target.dataset.foot ?? "").split(" · ")[0]} · ${when}`;
      const body = target.querySelector(".paper-card__body");
      if (body) body.textContent = swap(body.textContent ?? "");
      const foot = target.querySelector(".paper-card__foot span");
      if (foot) foot.textContent = target.dataset.foot;
    } else {
      target.textContent = `${line} · ${when}`;
      target.classList.add("is-live");
    }
  }
  document.dispatchEvent(new Event("paper:rescan"));
}
