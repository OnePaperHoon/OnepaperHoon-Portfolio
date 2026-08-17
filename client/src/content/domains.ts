import type { ServiceBrand } from "@/brands/serviceIdentity";

type LocalizedText = { en: string; ko: string };

export type DomainService = {
  id: string;
  name: string;
  domain: string;
  status: LocalizedText;
  phase: LocalizedText;
  copy: LocalizedText;
  href: string;
  action: LocalizedText;
  brand: ServiceBrand;
  state: "live" | "deploying" | "planned";
};

/** 공개·배포 예정 서비스를 현재 단계와 함께 소개하는 포트폴리오 도메인 레지스트리. */
export const domainServices: DomainService[] = [
  {
    id: "01",
    name: "Feedline",
    domain: "feedline.kr",
    status: { en: "LIVE NOW", ko: "지금 운영 중" },
    phase: { en: "MARKETING INTELLIGENCE", ko: "마케팅 인텔리전스" },
    copy: {
      en: "Connects the flow of Korean and global marketing RSS, original sources, briefings, and source health into one reading system.",
      ko: "국내외 마케팅 RSS의 흐름, 원문 소스, 브리핑과 소스 상태를 하나의 읽기 시스템으로 연결합니다.",
    },
    href: "https://feedline.kr",
    action: { en: "Open live service", ko: "서비스 열기" },
    brand: "feedline",
    state: "live",
  },
  {
    id: "02",
    name: "Roulette Side",
    domain: "rouletteside.com",
    status: { en: "LIVE NOW", ko: "지금 운영 중" },
    phase: { en: "IDEA ROULETTE", ko: "아이디어 룰렛" },
    copy: {
      en: "An idea slot machine that cuts the “what should I build” time — spin three axes and save the combo as a PNG card.",
      ko: "'뭘 만들지' 고민을 줄여주는 아이디어 슬롯머신. 세 축을 돌려 나온 조합을 PNG 카드로 저장합니다.",
    },
    href: "https://rouletteside.com",
    action: { en: "Open live service", ko: "서비스 열기" },
    brand: "rouletteSide",
    state: "live",
  },
  {
    id: "03",
    name: "Psychic Dollop",
    domain: "psychicdollop.com",
    status: { en: "ON THE HORIZON", ko: "다음 지평" },
    phase: { en: "FUTURE RELEASE", ko: "미래 릴리스" },
    copy: {
      en: "A domain reserved for the next round of product exploration and release.",
      ko: "이후의 제품 탐색과 배포를 위해 확보해 둔 다음 서비스 도메인입니다.",
    },
    href: "https://psychicdollop.com",
    action: { en: "View domain", ko: "도메인 보기" },
    brand: "psychicDollop",
    state: "planned",
  },
];
