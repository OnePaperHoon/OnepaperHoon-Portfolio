import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ko";

const STORAGE_KEY = "onepaperhoon-lang";

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ko" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

const LanguageContext = createContext<{ lang: Lang; toggleLang: () => void }>({ lang: "en", toggleLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang: () => setLang((current) => (current === "en" ? "ko" : "en")) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

const en = {
  navWork: "Work",
  navOrbit: "Orbit",
  navDomains: "Domains",
  navPlayground: "Playground",
  navNotes: "Notes",
  navAbout: "About",
  navStudio: "Studio",
  mobileTagline: "Seoul, KR · Available for selected collaborations",
  langToggleAria: "한국어로 보기",
  heroEyebrow: "Independent digital practice",
  scrollNote: "Explore selected work",
  workKicker: "Selected systems",
  workKickerSub: "2026 / live services & tools",
  orbitLabel: "Orbit / live systems",
  orbitLegendActive: "Active service",
  orbitLegendSelected: "Selected system",
  orbitPaused: "PAUSED / EXPLORE",
  orbitRunning: "PLANETS IN ORBIT / HOVER TO PAUSE",
  orbitOpen: "Open service",
  domainsLabel: "Live domains",
  domainsPreviewTab: "Preview tab icon",
  playgroundKicker: "Playground",
  playgroundKickerSub: "Small systems, in motion",
  playgroundOpen: "Open experiment",
  notesLabel: "Notes / working thoughts",
  manifestoLabel: "Approach",
  contactEyebrow: "A clear question is enough",
  contactMail: "Start by email",
  footerTagline: "Seoul, KR · Systems, motion, consequence.",
  detailBack: "Back to index",
  detailRole: "Role",
  detailTimeline: "Timeline",
  detailStack: "Stack",
  detailOpenLive: "Open live service",
  detailViewRepo: "View GitHub repository",
  detailOverviewLabel: "01 / Overview",
  detailPrincipleLabel: "02 / Principle",
  detailOutcomeLabel: "03 / Outcome",
  detailOverviewTail: "This case documents designing the system's rhythm so the next action and the original context are never lost, even in information-dense environments.",
  detailPrincipleCopy: "Rather than adding expression, the goal was to sharpen relationships — an interface where signals surface only at the moments they are needed.",
  detailPrevWork: "← Previous work",
  detailNextWork: "Next work →",
  detailReturn: "Return to selected work",
};

const ko: typeof en = {
  navWork: "작업",
  navOrbit: "궤도",
  navDomains: "도메인",
  navPlayground: "실험",
  navNotes: "기록",
  navAbout: "소개",
  navStudio: "스튜디오",
  mobileTagline: "서울 · 선별적 협업 가능",
  langToggleAria: "View in English",
  heroEyebrow: "독립 디지털 프랙티스",
  scrollNote: "선별된 작업 보기",
  workKicker: "선별된 시스템",
  workKickerSub: "2026 / 운영 중인 서비스와 도구",
  orbitLabel: "Orbit / 운영 중인 시스템",
  orbitLegendActive: "운영 중인 서비스",
  orbitLegendSelected: "선별된 시스템",
  orbitPaused: "일시 정지 / 탐색 중",
  orbitRunning: "궤도 공전 중 / 올리면 일시 정지",
  orbitOpen: "서비스 열기",
  domainsLabel: "운영 중인 도메인",
  domainsPreviewTab: "탭 아이콘 미리보기",
  playgroundKicker: "플레이그라운드",
  playgroundKickerSub: "작게, 움직이는 시스템",
  playgroundOpen: "실험 열기",
  notesLabel: "Notes / 작업 노트",
  manifestoLabel: "접근",
  contactEyebrow: "명확한 질문 하나면 충분합니다",
  contactMail: "이메일로 시작하기",
  footerTagline: "서울 · 시스템, 모션, 그리고 결과.",
  detailBack: "목록으로",
  detailRole: "역할",
  detailTimeline: "기간",
  detailStack: "스택",
  detailOpenLive: "서비스 열기",
  detailViewRepo: "GitHub 저장소 보기",
  detailOverviewLabel: "01 / 개요",
  detailPrincipleLabel: "02 / 원칙",
  detailOutcomeLabel: "03 / 결과",
  detailOverviewTail: "이 사례는 정보가 많은 환경에서도 다음 행동과 원래의 맥락을 잃지 않도록 시스템의 리듬을 설계한 기록입니다.",
  detailPrincipleCopy: "표현을 늘리는 대신 관계를 선명하게 하고, 필요한 순간에만 신호가 드러나는 인터페이스를 목표로 했습니다.",
  detailPrevWork: "← 이전 작업",
  detailNextWork: "다음 작업 →",
  detailReturn: "작업 목록으로 돌아가기",
};

export const UI: Record<Lang, typeof en> = { en, ko };
