/**
 * 지금 돌아가는 서비스들의 실제 상태.
 * 빌드할 때 한 번 받아 "배포 시점 기준" 문구로 심어 두고, 브라우저에서는 src/scripts/live-status.ts 가
 * 같은 주소를 다시 불러 방문 시점의 값으로 바꿉니다. (브라우저 쪽은 각 서비스가 onepaperhoon.com 에 CORS 를 열어야 동작합니다.)
 *
 * 새 서비스를 붙이려면 SERVICES 에 항목 하나를 더하면 됩니다. 작업 id(src/content/work/<id>.md) 와 같은 키를 씁니다.
 */
export type LiveStatus = {
  /** 종이와 목록에 찍히는 한 줄. 예: "소스 25/25 정상" */
  line: string;
  /** 마지막으로 점검·갱신된 시각 (ISO) */
  checkedAt: string;
};

type Service = {
  /** 브라우저에서도 부를 수 있는(CORS 열린) 주소. 빌드 때는 이 주소를 먼저 씁니다. */
  url: string;
  /** 빌드 전용 예비 주소 (CORS 가 없어도 됨) */
  fallback?: string;
  parse: (data: unknown) => LiveStatus | null;
};

const iso = (value: unknown, orNow = true) => (typeof value === "string" ? value : orNow ? new Date().toISOString() : "");

export const SERVICES: Record<string, Service> = {
  feedline: {
    url: "https://feedline.kr/api/public-status",
    fallback: "https://feedline.kr/api/briefing",
    parse(data) {
      const d = data as { sourceCount?: unknown; totalSourceCount?: unknown; healthCheckedAt?: unknown; generatedAt?: unknown } | null;
      if (!d || typeof d.sourceCount !== "number" || typeof d.totalSourceCount !== "number") return null;
      return { line: `소스 ${d.sourceCount}/${d.totalSourceCount} 정상`, checkedAt: iso(d.healthCheckedAt, false) || iso(d.generatedAt) };
    },
  },
  sobok: {
    url: "https://sobok.onepaperhoon.com/api/health",
    parse(data) {
      // {"ok":true,"lag":{"obs_h":1.1,"fcst_h":3.1,"stale":false},"last_ok":{"fcst":"2026-11-17T13:20:01","obs":"..."}}
      const d = data as { ok?: unknown; lag?: { obs_h?: unknown; fcst_h?: unknown; stale?: unknown }; last_ok?: { obs?: unknown; fcst?: unknown } } | null;
      if (!d || d.ok !== true || typeof d.lag?.obs_h !== "number") return null;
      const hours = (h: number) => (h < 1 ? `${Math.max(1, Math.round(h * 60))}분 전` : `${Math.round(h * 10) / 10}시간 전`);
      const fcst = typeof d.lag.fcst_h === "number" ? ` · 예보 ${hours(d.lag.fcst_h)}` : "";
      const line = d.lag.stale ? `수집 지연 (관측 ${hours(d.lag.obs_h)})` : `관측 ${hours(d.lag.obs_h)}${fcst} 갱신`;
      // 소복 서버는 KST 벽시계를 시간대 없이 돌려줍니다.
      const last = typeof d.last_ok?.obs === "string" ? `${d.last_ok.obs}+09:00` : "";
      return { line, checkedAt: last || new Date().toISOString() };
    },
  },
};

export const LIVE_IDS = Object.keys(SERVICES);

async function fetchJson(url: string, timeout: number) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.json();
}

/** 빌드 시점에 한 서비스의 상태를 받습니다. 서비스가 내려가 있거나 빌드 환경이 오프라인이어도 빌드는 계속됩니다. */
export async function fetchLiveStatus(id: string): Promise<LiveStatus | null> {
  const service = SERVICES[id];
  if (!service) return null;
  for (const url of [service.url, service.fallback].filter((u): u is string => !!u)) {
    try {
      const status = service.parse(await fetchJson(url, 6000));
      if (status) return status;
    } catch {
      // 다음 주소로
    }
  }
  return null;
}

/** 브라우저에서 방문 시점의 값을 다시 받습니다. CORS 가 열린 주소만 씁니다. */
export async function fetchLiveStatusInBrowser(id: string): Promise<LiveStatus | null> {
  const service = SERVICES[id];
  if (!service) return null;
  try {
    return service.parse(await fetchJson(service.url, 5000));
  } catch {
    return null;
  }
}

export async function fetchAllLiveStatus(): Promise<Record<string, LiveStatus>> {
  const entries = await Promise.all(LIVE_IDS.map(async (id) => [id, await fetchLiveStatus(id)] as const));
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, LiveStatus] => entry[1] !== null));
}
