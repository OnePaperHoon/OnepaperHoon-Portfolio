/**
 * onepaperhoon 프로젝트 등록 파일
 *
 * 새 작업을 추가하려면 projects 배열에 한 항목을 복사해 작성하세요.
 * image에는 웹 자산으로 업로드한 이미지 경로를, grid에는 feature | side | small 중 하나를 입력합니다.
 */
export type Project = {
  id: string;
  slug?: string;
  title: string;
  year: string;
  kind: string;
  description: string;
  longDescription: string;
  image?: string;
  thumbnailUrl?: string;
  ogImageUrl?: string;
  role: string;
  timeline: string;
  stack: string;
  principle: string;
  problem: string;
  outcome: string;
  visual: "image" | "studio";
  grid: "feature" | "side" | "small";
  repository?: string;
  liveUrl?: string;
  /** 한국어 표시 문구. 지정된 필드만 ko 모드에서 교체됩니다. */
  ko?: Partial<Pick<Project, "kind" | "description" | "longDescription" | "role" | "timeline" | "principle" | "problem" | "outcome">>;
};

/** 언어에 맞는 표시용 프로젝트를 돌려줍니다. ko 문구가 없는 필드는 영어를 유지합니다. */
export function localizeProject(project: Project, lang: "en" | "ko"): Project {
  if (lang !== "ko" || !project.ko) return project;
  return { ...project, ...project.ko };
}

export const assets = {
  signal: "/manus-storage/onepaperhoon-signal-hero_725caca1.png",
  archive: "/manus-storage/onepaperhoon-archive_e22ef276.png",
  tide: "/manus-storage/onepaperhoon-tide_8f18d378.png",
  tools: "/manus-storage/onepaperhoon-tools_4dc91050.png",
  mark: "/manus-storage/onepaperhoon-mark_97e4a1d0.png",
};

export const projects: Project[] = [
  {
    id: "feedline", title: "FeedLine", year: "2026", kind: "Marketing intelligence",
    description: "A live directory for marketing signals, sources, briefs, and source health.",
    longDescription: "A marketing intelligence service that brings scattered Korean and global source feeds into one usable reading system.",
    image: assets.archive, role: "Product · Service design · Development", timeline: "Prototype · 2026", stack: "TypeScript · Cloudflare Workers · D1 · Drizzle",
    principle: "Start with a trustworthy source, then make the next read obvious.",
    problem: "Marketing updates were dispersed across feeds, newsletters, search, and social platforms, making it difficult to see both the signal and its original source.",
    outcome: "A live system for browsing source directories, current topics, search, briefings, and connection health without losing the path back to the original material.",
    visual: "image", grid: "feature", liveUrl: "https://feedline.kr", ogImageUrl: assets.archive,
    ko: {
      kind: "마케팅 인텔리전스",
      description: "마케팅 신호, 원문 소스, 브리핑, 소스 상태를 하나로 모은 라이브 디렉터리.",
      longDescription: "흩어진 국내외 마케팅 피드를 하나의 읽기 시스템으로 모으는 마케팅 인텔리전스 서비스.",
      role: "기획 · 서비스 설계 · 개발", timeline: "프로토타입 · 2026",
      principle: "신뢰할 수 있는 소스에서 시작해, 다음에 읽을 것을 분명하게 만든다.",
      problem: "마케팅 소식이 피드·뉴스레터·검색·소셜에 흩어져 있어, 신호와 그 원문 소스를 함께 보기 어려웠습니다.",
      outcome: "소스 디렉터리, 현재 토픽, 검색, 브리핑, 연결 상태를 원문으로 돌아가는 길을 잃지 않고 탐색하는 라이브 시스템.",
    },
  },
  {
    id: "yenwatch", title: "YenWatch", year: "2026", kind: "Always-on monitoring",
    description: "A JPY/KRW monitor that turns a one-minute data stream into one calm status surface.",
    longDescription: "A Raspberry Pi service that watches the JPY/KRW exchange rate and routes the right state to Discord, Notion, and local storage.",
    image: assets.signal, role: "System design · Backend · Operations", timeline: "Ongoing · 2026", stack: "TypeScript · Node.js · SQLite · Discord · Notion",
    principle: "A status should stay current without becoming noise.",
    problem: "Checking exchange rates repeatedly is tedious, while sending a new notification every minute makes the information easier to ignore.",
    outcome: "A resilient monitoring service with one continuously updated Discord status, threshold alerts, data retention, a management CLI, and independent failure handling across outputs.",
    visual: "image", grid: "side", repository: "https://github.com/OnePaperHoon/RateBot", ogImageUrl: assets.signal,
    ko: {
      kind: "상시 모니터링",
      description: "1분 단위 데이터 스트림을 하나의 조용한 상태 화면으로 바꾸는 엔/원 환율 모니터.",
      longDescription: "JPY/KRW 환율을 지켜보다가 Discord·Notion·로컬 저장소로 알맞은 상태를 전달하는 라즈베리파이 서비스.",
      role: "시스템 설계 · 백엔드 · 운영", timeline: "운영 중 · 2026",
      principle: "상태는 소음이 되지 않으면서도 항상 최신이어야 한다.",
      problem: "환율을 반복해서 확인하는 일은 번거롭고, 매분 새 알림을 보내면 오히려 정보를 무시하게 됩니다.",
      outcome: "계속 갱신되는 Discord 상태 하나, 임계값 알림, 데이터 보존, 관리 CLI, 출력별 독립 장애 처리를 갖춘 모니터링 서비스.",
    },
  },
  {
    id: "claude-code-alert", title: "ClaudeCodeAlert", year: "2026", kind: "Developer tooling",
    description: "A cross-platform CLI that makes Claude Code lifecycle events perceptible at the right moment.",
    longDescription: "A hook-based developer tool that adds configurable sound and toast cues to Claude Code events without taking control away from the user.",
    image: assets.tools, role: "CLI UX · TypeScript · Release design", timeline: "v1.0 · 2026", stack: "TypeScript · Node.js · PowerShell · Shell",
    principle: "Let long-running work call you back, not interrupt you.",
    problem: "Long-running coding sessions finish, request input, or change state while attention has already moved elsewhere.",
    outcome: "An interactive setup flow that detects existing hooks, previews changes, keeps backups, and offers in-tool notification controls across Windows and macOS.",
    visual: "image", grid: "small", repository: "https://github.com/OnePaperHoon/ClaudeCodeAlert", liveUrl: "https://www.npmjs.com/package/claude-code-alert", ogImageUrl: assets.tools,
    ko: {
      kind: "개발자 도구",
      description: "Claude Code 라이프사이클 이벤트를 필요한 순간에 알아차리게 하는 크로스플랫폼 CLI.",
      longDescription: "사용자에게서 제어를 빼앗지 않으면서 Claude Code 이벤트에 사운드·토스트 신호를 더하는 훅 기반 개발자 도구.",
      role: "CLI UX · TypeScript · 릴리스 설계", timeline: "v1.0 · 2026",
      principle: "오래 걸리는 작업이 당신을 다시 부르게 하되, 방해하지는 않게.",
      problem: "긴 코딩 세션은 주의가 이미 다른 곳으로 옮겨간 뒤에 끝나거나, 입력을 요청하거나, 상태가 바뀝니다.",
      outcome: "기존 훅 감지, 변경 미리보기, 백업 유지, Windows·macOS 알림 제어까지 갖춘 인터랙티브 설치 플로우.",
    },
  },
  {
    id: "codex-alert", title: "CodexAlert", year: "2026", kind: "Developer tooling",
    description: "A configurable lifecycle signal layer for OpenAI Codex CLI workflows.",
    longDescription: "A cross-platform alert library for Codex lifecycle hooks, including safe setup, event filtering, and in-session notification controls.",
    image: assets.tide, role: "CLI UX · TypeScript · Platform integration", timeline: "v1.0 · 2026", stack: "TypeScript · PowerShell · Shell · npm",
    principle: "Make important transitions audible, not overwhelming.",
    problem: "Codex task and tool events can be meaningful, but listening to every event quickly turns a useful cue into alert fatigue.",
    outcome: "A CLI that installs only its own hooks, guides trust and conflict handling, supports fine-grained event matching, and keeps notification state controllable from Codex itself.",
    visual: "image", grid: "small", repository: "https://github.com/OnePaperHoon/CodexAlert", liveUrl: "https://www.npmjs.com/package/codex-alert", ogImageUrl: assets.tide,
    ko: {
      kind: "개발자 도구",
      description: "OpenAI Codex CLI 워크플로우를 위한 설정 가능한 라이프사이클 신호 레이어.",
      longDescription: "안전한 설치, 이벤트 필터링, 세션 내 알림 제어를 갖춘 Codex 라이프사이클 훅 알림 라이브러리.",
      role: "CLI UX · TypeScript · 플랫폼 연동", timeline: "v1.0 · 2026",
      principle: "중요한 전환은 들리게, 그러나 과하지 않게.",
      problem: "Codex의 태스크·도구 이벤트는 의미가 있지만, 모든 이벤트를 들으면 유용한 신호가 금방 알림 피로로 변합니다.",
      outcome: "자기 훅만 설치하고, 신뢰·충돌 처리를 안내하며, 세밀한 이벤트 매칭과 Codex 안에서의 알림 상태 제어를 지원하는 CLI.",
    },
  },
];
