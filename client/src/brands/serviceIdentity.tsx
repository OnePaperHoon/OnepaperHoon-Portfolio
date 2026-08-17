export const serviceIdentities = {
  feedline: { name: "Feedline", accent: "#c7ff36", description: "rising source bars forming a forward arrow" },
  rouletteSide: { name: "Roulette Side", accent: "#ff8a0d", description: "the pre-spin screen itself — a question mark over an orange bar" },
  psychicDollop: { name: "Psychic Dollop", accent: "#c7a6ff", description: "an intuitive ripple with a focused center" },
} as const;

export type ServiceBrand = keyof typeof serviceIdentities;

/** Feedline은 실서비스 브랜드 PNG를 그대로 사용한다 (feedline.kr/brand 원본 축소본). */
const feedlineIconUrl = "/brand/feedline-icon.png";

type ServiceMarkProps = {
  brand: ServiceBrand;
  size?: number;
  className?: string;
  title?: string;
};

/** Reusable brand mark for cards, favicons, and future product touchpoints. */
export function ServiceMark({ brand, size = 48, className, title }: ServiceMarkProps) {
  const label = title ?? serviceIdentities[brand].name;

  if (brand === "feedline") {
    return <img className={className} src={feedlineIconUrl} width={size} height={size} alt={label} style={{ borderRadius: Math.round(size * 0.25) }} loading="lazy" decoding="async" />;
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
      <rect width="48" height="48" rx="12" fill="#111111" />
      {brand === "rouletteSide" && <>
        <text x="24" y="22.5" fontFamily="Arial, 'Malgun Gothic', sans-serif" fontSize="30" fontWeight="700" fill="#ffffff" textAnchor="middle" dominantBaseline="central">?</text>
        <rect x="10.5" y="37.5" width="27" height="5.25" rx="2.6" fill="#ff8a0d" />
      </>}
      {brand === "psychicDollop" && <>
        <path d="M24 10C15.9 10 11 16.2 11 24c0 8.3 5.4 14 13 14 7.7 0 13-5.7 13-14 0-7.8-4.9-14-13-14Z" fill="none" stroke="#f5f5f0" strokeWidth="2" />
        <path d="M17 24c0-4.2 2.7-7 7-7 4.2 0 7 2.8 7 7 0 4.1-2.8 7-7 7-4.3 0-7-2.9-7-7Z" fill="#c7a6ff" />
        <circle cx="24" cy="24" r="2" fill="#0b0d0e" />
      </>}
    </svg>
  );
}

/** rouletteside.com이 실제로 배포한 파비콘 SVG (vault 원본과 동일). */
const rouletteSideFaviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#111111"/><text x="32" y="30" font-family="Arial, \'Malgun Gothic\', sans-serif" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">?</text><rect x="14" y="50" width="36" height="7" rx="3.5" fill="#ff8a0d"/></svg>';

const psychicDollopFaviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#111111"/><path d="M24 10C15.9 10 11 16.2 11 24c0 8.3 5.4 14 13 14 7.7 0 13-5.7 13-14 0-7.8-4.9-14-13-14Z" fill="none" stroke="#f5f5f0" stroke-width="2"/><path d="M17 24c0-4.2 2.7-7 7-7 4.2 0 7 2.8 7 7 0 4.1-2.8 7-7 7-4.3 0-7-2.9-7-7Z" fill="#c7a6ff"/><circle cx="24" cy="24" r="2" fill="#0b0d0e"/></svg>';

const serviceFavicons: Record<ServiceBrand, { href: string; type: string }> = {
  feedline: { href: feedlineIconUrl, type: "image/png" },
  rouletteSide: { href: `data:image/svg+xml,${encodeURIComponent(rouletteSideFaviconSvg)}`, type: "image/svg+xml" },
  psychicDollop: { href: `data:image/svg+xml,${encodeURIComponent(psychicDollopFaviconSvg)}`, type: "image/svg+xml" },
};

/** Call once in each product entry point to set that product's favicon. */
export function setServiceFavicon(brand: ServiceBrand) {
  const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  const favicon = existing ?? document.createElement("link");
  favicon.rel = "icon";
  favicon.type = serviceFavicons[brand].type;
  favicon.href = serviceFavicons[brand].href;
  favicon.dataset.serviceFavicon = brand;
  if (!existing) document.head.appendChild(favicon);
}
