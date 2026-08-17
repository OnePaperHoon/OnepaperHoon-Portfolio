import { ServiceMark, setServiceFavicon } from "@/brands/serviceIdentity";
import { domainServices } from "@/content/domains";
import { UI, useLang } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";

export default function LiveDomainsSection({ onReady }: { onReady: () => void }) {
  const { lang } = useLang();
  const t = UI[lang];
  useEffect(() => { onReady(); }, [onReady]);
  return <section className="page-shell domains-section" data-reveal aria-labelledby="domains-title"><div className="domains-intro"><p className="manifesto-label">{t.domainsLabel}</p><div>{lang === "ko"
    ? <h2 id="domains-title">도메인은 주소가 아니라<br /><span>공개를 기다리는 다음 인터페이스</span>입니다.</h2>
    : <h2 id="domains-title">A domain is not an address —<br /><span>it is the next interface waiting to ship</span>.</h2>}
  {lang === "ko"
    ? <p>운영 중인 서비스와 배포를 준비하는 다음 제품을 같은 필드 안에서 추적합니다. 각 도메인은 현재 상태와 다음 공개 지점을 함께 보여줍니다.</p>
    : <p>Live services and the next products preparing to ship are tracked in the same field. Each domain shows its current state and its next release point.</p>}
  </div></div><div className="domains-grid">{domainServices.map((service) => <article className={`domain-card domain-card--${service.state}`} key={service.domain}><div className="domain-card__head"><span>{service.id}</span><span className="domain-card__status"><i aria-hidden="true" />{service.status[lang]}</span></div><div className="domain-card__body"><div className="domain-card__identity"><ServiceMark brand={service.brand} className="domain-card__mark" title={`${service.name} 로고`} /><p>{service.phase[lang]}</p></div><h3>{service.name}</h3><a className="domain-card__domain" href={service.href} target="_blank" rel="noreferrer" aria-label={`${service.domain} 열기`}>{service.domain}<ArrowUpRight size={15} aria-hidden="true" /></a><p className="domain-card__copy">{service.copy[lang]}</p></div><div className="domain-card__controls"><button className="domain-card__favicon" type="button" onClick={() => setServiceFavicon(service.brand)} aria-label={`${service.name} 파비콘을 현재 탭에 미리보기`}>{t.domainsPreviewTab} <ServiceMark brand={service.brand} size={16} title={`${service.name} 파비콘`} /></button><a className="domain-card__action" href={service.href} target="_blank" rel="noreferrer">{service.action[lang]}<ArrowUpRight size={15} aria-hidden="true" /></a></div></article>)}</div></section>;
}
