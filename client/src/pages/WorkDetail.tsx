import { ArrowLeft, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { UI, useLang } from "@/lib/i18n";
import { getProjectCardImage } from "@/lib/projectCardImage";
import { findStaticProjectBySlug } from "@/lib/workRoutes";
import { getAdjacentWorks } from "@/lib/workSequence";
import { assets, localizeProject, projects, type Project } from "@/content/projects";
import NotFound from "./NotFound";

function updateMeta(name: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${name}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(name, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

function WorkDetailContent({ project, slug, projectItems }: { project: Project; slug: string; projectItems: Project[] }) {
  const { lang, toggleLang } = useLang();
  const t = UI[lang];
  const localized = localizeProject(project, lang);
  const image = getProjectCardImage(project) ?? assets.signal;
  const adjacentWorks = getAdjacentWorks(projectItems, slug);
  const [theme, setTheme] = useState<"dark" | "light">(() => document.documentElement.classList.contains("light") ? "light" : "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("onepaperhoon-theme-v2", theme);
  }, [theme]);

  useEffect(() => {
    const url = `https://onepaperhoon.com/work/${slug}`;
    const title = `${project.title} — onepaperhoon`;
    const ogImage = project.ogImageUrl ?? image;
    const socialImage = ogImage.startsWith("http") ? ogImage : `https://onepaperhoon.com${ogImage}`;
    document.title = title;
    updateCanonical(url);
    updateMeta("name", "description", project.description);
    updateMeta("property", "og:title", title);
    updateMeta("property", "og:description", project.description);
    updateMeta("property", "og:url", url);
    updateMeta("property", "og:image", socialImage);
    updateMeta("name", "twitter:title", title);
    updateMeta("name", "twitter:description", project.description);
    updateMeta("name", "twitter:image", socialImage);
    return () => {
      document.title = "onepaperhoon — Interfaces with a pulse";
      updateCanonical("https://onepaperhoon.com/");
      updateMeta("name", "description", "onepaperhoon은 코드, 디자인, 이야기가 만나는 지점에서 명료한 시스템과 오래 남는 인터랙션을 만드는 독립 디지털 프랙티스입니다.");
      updateMeta("property", "og:title", "onepaperhoon — Interfaces with a pulse");
      updateMeta("property", "og:description", "명료한 시스템과 오래 남는 인터랙션을 만드는 독립 디지털 프랙티스.");
      updateMeta("property", "og:url", "https://onepaperhoon.com/");
      updateMeta("property", "og:image", "https://onepaperhoon.com/manus-storage/onepaperhoon-signal-hero_725caca1.png");
      updateMeta("name", "twitter:title", "onepaperhoon — Interfaces with a pulse");
      updateMeta("name", "twitter:description", "명료한 시스템과 오래 남는 인터랙션을 만드는 독립 디지털 프랙티스.");
      updateMeta("name", "twitter:image", "https://onepaperhoon.com/manus-storage/onepaperhoon-signal-hero_725caca1.png");
    };
  }, [image, project.description, project.title, slug]);

  return <div className="app-shell work-detail-shell">
    <div className="noise" aria-hidden="true" />
    <header className="work-detail-nav">
      <a className="brand" href="/" aria-label="onepaperhoon 홈으로 이동"><span className="brand-mark" aria-hidden="true" /><span>onepaperhoon</span></a>
      <div className="work-detail-nav__actions">
        <button className="theme-toggle lang-toggle" type="button" onClick={toggleLang} aria-label={t.langToggleAria}>
          {lang === "en" ? "한" : "EN"}
        </button>
        <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"} aria-pressed={theme === "light"}>
          {theme === "dark" ? <Moon className="moon" size={16} /> : <Sun className="sun" size={16} />}
        </button>
        <a className="work-detail-nav__back" href="/#work"><ArrowLeft size={15} /> {t.detailBack}</a>
      </div>
    </header>
    <main className="detail detail--standalone">
      <section className="page-shell detail-hero">
        <div>
          <p className="detail-category">{localized.kind}</p>
          <h1 className="detail-title">{localized.title}</h1>
          <p className="detail-summary">{localized.longDescription}</p>
          <div className="detail-meta">
            <div><span>{t.detailRole}</span><strong>{localized.role}</strong></div>
            <div><span>{t.detailTimeline}</span><strong>{localized.timeline}</strong></div>
            <div><span>{t.detailStack}</span><strong>{localized.stack}</strong></div>
          </div>
          {(project.liveUrl || project.repository) && <div className="detail-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">{t.detailOpenLive} <ArrowUpRight size={15} /></a>}
            {project.repository && <a href={project.repository} target="_blank" rel="noreferrer">{t.detailViewRepo} <ArrowUpRight size={15} /></a>}
          </div>}
        </div>
        <div className="detail-visual">
          {project.visual === "studio" ? <div className="studio-visual" /> : <img src={image} alt={`${project.title} 프로젝트 대표 이미지`} />}
        </div>
      </section>

      <section className="page-shell case-section">
        <p className="case-label">{t.detailOverviewLabel}</p>
        <div className="case-content"><h2>{localized.problem}</h2><p>{localized.description} {t.detailOverviewTail}</p></div>
      </section>
      <section className="page-shell case-section principle">
        <div className="principle-visual" aria-hidden="true" />
        <div className="case-content"><p className="case-label">{t.detailPrincipleLabel}</p><h2>{localized.principle}</h2><p>{t.detailPrincipleCopy}</p></div>
      </section>
      <section className="page-shell case-section outcome">
        <div className="outcome-head"><p className="case-label">{t.detailOutcomeLabel}</p><div className="case-content"><h2>{localized.outcome}</h2></div></div>
        <div className="gallery-main"><img src={image} alt={`${project.title} 결과물 이미지`} /></div>
      </section>
      {adjacentWorks && <nav className="page-shell work-pagination" aria-label="다른 Work 탐색">
        <a className="work-pagination__previous" href={`/work/${adjacentWorks.previous.slug ?? adjacentWorks.previous.id}`}><span>{t.detailPrevWork}</span><strong>{adjacentWorks.previous.title}</strong></a>
        <a className="work-pagination__next" href={`/work/${adjacentWorks.next.slug ?? adjacentWorks.next.id}`}><span>{t.detailNextWork}</span><strong>{adjacentWorks.next.title}</strong></a>
      </nav>}
      <section className="page-shell work-detail-close"><a href="/#work">{t.detailReturn} <ArrowUpRight size={16} /></a></section>
    </main>
  </div>;
}

export default function WorkDetail() {
  const [, params] = useRoute("/work/:slug");
  const slug = params?.slug ?? "";
  const staticProject = findStaticProjectBySlug(slug);
  const projectItems = useMemo(() => [...projects], []);

  if (staticProject) return <WorkDetailContent project={staticProject} slug={slug} projectItems={projectItems} />;
  return <NotFound />;
}
