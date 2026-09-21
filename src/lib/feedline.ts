/**
 * FeedLine의 실제 운영 상태. 빌드할 때 한 번 받아 "배포 시점 기준" 숫자로 심어 두고,
 * 브라우저에서는 src/scripts/live-status.ts가 같은 주소를 다시 불러 지금 값으로 바꿉니다.
 * (브라우저 쪽은 FeedLine이 CORS를 허용해야 동작합니다. 막혀 있으면 빌드 때의 숫자가 그대로 남습니다.)
 */
export type FeedlineStatus = { ok: number; total: number; checkedAt: string };

/**
 * 브라우저에서 다시 불러올지. FeedLine이 onepaperhoon.com에 CORS를 허용하기 전에는 요청이 전부 막혀
 * 콘솔에 오류만 남기므로 꺼 둡니다. FeedLine에 공개 상태 주소(CORS 허용)를 추가한 뒤 true로 바꾸세요.
 */
export const FEEDLINE_BROWSER_FETCH = false;

/** 가벼운 공개 상태 주소를 먼저, 없으면 브리핑 API에서 같은 필드를 읽습니다. */
export const FEEDLINE_STATUS_URLS = ["https://feedline.kr/api/public-status", "https://feedline.kr/api/briefing"];

export function parseFeedlineStatus(data: unknown): FeedlineStatus | null {
  const d = data as { sourceCount?: unknown; totalSourceCount?: unknown; healthCheckedAt?: unknown; generatedAt?: unknown } | null;
  if (!d || typeof d.sourceCount !== "number" || typeof d.totalSourceCount !== "number") return null;
  const checkedAt = typeof d.healthCheckedAt === "string" ? d.healthCheckedAt : typeof d.generatedAt === "string" ? d.generatedAt : new Date().toISOString();
  return { ok: d.sourceCount, total: d.totalSourceCount, checkedAt };
}

export async function fetchFeedlineStatus(): Promise<FeedlineStatus | null> {
  for (const url of FEEDLINE_STATUS_URLS) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json" } });
      if (!response.ok) continue;
      const status = parseFeedlineStatus(await response.json());
      if (status) return status;
    } catch {
      // 빌드 환경이 오프라인이거나 FeedLine이 내려가 있어도 빌드는 계속됩니다.
    }
  }
  return null;
}

export const feedlineLine = (status: FeedlineStatus) => `소스 ${status.ok}/${status.total} 정상`;
