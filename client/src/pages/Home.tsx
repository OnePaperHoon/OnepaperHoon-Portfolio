import { ArrowUpRight, CircleDot, Menu, Moon, Sun, X } from "lucide-react";
import { lazy, MouseEvent, Suspense, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { assets, localizeProject, projects, type Project } from "@/content/projects";
import { UI, useLang } from "@/lib/i18n";
import { getProjectCardImage, hasProjectCardImage } from "@/lib/projectCardImage";
import { getProjectSlug } from "@/lib/workRoutes";

const PlaygroundOrbitIcon = lazy(() => import("lucide-react/dist/esm/icons/orbit.js"));
const PlaygroundBookIcon = lazy(() => import("lucide-react/dist/esm/icons/book-open.js"));
const PlaygroundRadioIcon = lazy(() => import("lucide-react/dist/esm/icons/radio.js"));
const DetailBackIcon = lazy(() => import("lucide-react/dist/esm/icons/arrow-left.js"));
const DetailZoomIcon = lazy(() => import("lucide-react/dist/esm/icons/zoom-in.js"));
const DeferredOrbitSection = lazy(() => import("@/components/OrbitSection"));
const LiveDomainsSection = lazy(() => import("@/components/LiveDomainsSection"));

const processSteps = [
  ["01", "Locate the source of truth", "Identify the original signal, the state that matters, and the failure modes before adding an interface.", "grid"],
  ["02", "Route meaning, not raw events", "Use cadence, thresholds, and focused surfaces so a service says what changed without demanding attention all the time.", "orbits"],
  ["03", "Make the system operable", "Expose setup, health, recovery, and control states so the work can remain useful after its first release.", "layers"],
] as const;

const notes = [
  {
    date: { en: "14 AUG 2026", ko: "2026.08.14" }, read: { en: "4 MIN", ko: "4분" },
    title: { en: "Why an interface needs a resting state", ko: "인터페이스에 쉬는 상태가 필요한 이유" },
    excerpt: { en: "Every responsive system needs a quiet default before motion can mean anything.", ko: "모든 반응형 시스템에는 움직임이 의미를 갖기 전, 조용한 기본 상태가 필요하다." },
  },
  {
    date: { en: "03 AUG 2026", ko: "2026.08.03" }, read: { en: "6 MIN", ko: "6분" },
    title: { en: "The archive is not a shelf", ko: "아카이브는 선반이 아니다" },
    excerpt: { en: "A good index does more than store material. It makes a route through it visible.", ko: "좋은 인덱스는 자료를 보관하는 데 그치지 않고, 그 사이를 지나는 경로를 보이게 만든다." },
  },
  {
    date: { en: "22 JUL 2026", ko: "2026.07.22" }, read: { en: "3 MIN", ko: "3분" },
    title: { en: "Proximity is a design material", ko: "가까움은 디자인 재료다" },
    excerpt: { en: "Distance, delay, and scale can explain relationship without adding another label.", ko: "거리, 지연, 크기는 라벨을 하나 더 붙이지 않고도 관계를 설명할 수 있다." },
  },
];

const playgroundItems = [
  {
    id: "01", label: { en: "SOURCE HEALTH", ko: "소스 상태" }, title: "Source Pulse",
    copy: { en: "A compact way to show freshness, parser state, and a source that has quietly stopped talking.", ko: "소스의 신선도, 파서 상태, 그리고 조용히 멈춰 버린 소스를 작게 보여주는 방법." },
    icon: PlaygroundOrbitIcon,
  },
  {
    id: "02", label: { en: "SETUP FLOW", ko: "설치 플로우" }, title: "Safe Config",
    copy: { en: "A configuration interface that detects conflicts, previews the diff, and lets the operator decide.", ko: "충돌을 감지하고 변경 내용을 미리 보여준 뒤, 결정은 운영자에게 맡기는 설정 인터페이스." },
    icon: PlaygroundBookIcon,
  },
  {
    id: "03", label: { en: "EVENT DESIGN", ko: "이벤트 설계" }, title: "Quiet Alert",
    copy: { en: "An experiment in separating meaningful lifecycle signals from the events that can stay silent.", ko: "의미 있는 라이프사이클 신호와 조용히 있어도 되는 이벤트를 분리하는 실험." },
    icon: PlaygroundRadioIcon,
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  const { lang } = useLang();
  const localized = localizeProject(project, lang);
  const imageSource = getProjectCardImage(project);
  const hasCover = project.visual !== "studio" && hasProjectCardImage(project);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">(hasCover ? "loading" : "ready");
  useEffect(() => setImageState(hasCover ? "loading" : "ready"), [hasCover, imageSource, project.id]);
  const handleMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--mx", `${x * 100}%`);
    event.currentTarget.style.setProperty("--my", `${y * 100}%`);
    event.currentTarget.style.setProperty("--rx", `${(y - 0.5) * -5}deg`);
    event.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 5}deg`);
  };

  const resetCard = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <button
      type="button"
      className={`project-card project-card--${project.grid} is-thumbnail-${imageState}`}
      onClick={() => onOpen(project)}
      onMouseMove={handleMove}
      onMouseLeave={resetCard}
      aria-label={`${project.title} 프로젝트 상세 보기`}
      aria-busy={imageState === "loading"}
    >
      {hasCover ? <>
        <span className="project-image-skeleton" aria-hidden="true" />
        <img className="project-image" src={imageSource} alt="" loading="lazy" decoding="async" onLoad={() => setImageState("ready")} onError={() => setImageState("error")} />
      </> : <div className="studio-visual" />}
      <span className="project-arrow"><ArrowUpRight size={17} /></span>
      <span className="project-body">
        <span className="project-meta"><span>{localized.year}</span><span>{localized.kind}</span></span>
        <span className="project-title">{localized.title}</span>
        <span className="project-description">{localized.description}</span>
      </span>
    </button>
  );
}

function ViewportDeferredSection({ children, className, id, label, placeholderClass }: { children: ReactNode; className?: string; id: string; label: string; placeholderClass: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setShouldLoad(true); observer.disconnect(); } }, { rootMargin: "900px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={sectionRef} className={className} id={id}>{shouldLoad ? children : <div className={`page-shell section-chunk-placeholder ${placeholderClass}`} aria-label={`${label} 영역은 스크롤 접근 시 준비됩니다.`} />}</div>;
}

function Header({ theme, toggleTheme, onNavigate, isDetail }: { theme: "dark" | "light"; toggleTheme: () => void; onNavigate: (id: string) => void; isDetail: boolean }) {
  const { lang, toggleLang } = useLang();
  const t = UI[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigate = (id: string) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="header-inner">
          <button className="brand" onClick={() => navigate("home")} aria-label="onepaperhoon 홈으로 이동">
            <span className="brand-mark" aria-hidden="true" />
            <span>onepaperhoon</span>
          </button>
          <nav className="desktop-nav" aria-label="주요 메뉴">
            <button className="nav-link" onClick={() => navigate("work")}>{t.navWork}</button>
            <button className="nav-link" onClick={() => navigate("orbit")}>{t.navOrbit}</button>
            <button className="nav-link" onClick={() => navigate("domains")}>{t.navDomains}</button>
            <button className="nav-link" onClick={() => navigate("playground")}>{t.navPlayground}</button>
            <button className="nav-link" onClick={() => navigate("notes")}>{t.navNotes}</button>
            <button className="nav-link" onClick={() => navigate("about")}>{t.navAbout}</button>
            <button className="nav-link" onClick={() => window.location.assign("/studio")}>{t.navStudio}</button>
          </nav>
          <div className="header-actions">
            <button className="theme-toggle lang-toggle" type="button" onClick={toggleLang} aria-label={t.langToggleAria}>
              {lang === "en" ? "한" : "EN"}
            </button>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"} aria-pressed={theme === "light"}>
              {theme === "dark" ? <Moon className="moon" size={16} /> : <Sun className="sun" size={16} />}
            </button>
            <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="메뉴 열기" aria-expanded={menuOpen}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <button onClick={() => navigate("work")}>{t.navWork}</button>
        <button onClick={() => navigate("orbit")}>{t.navOrbit}</button>
        <button onClick={() => navigate("domains")}>{t.navDomains}</button>
        <button onClick={() => navigate("playground")}>{t.navPlayground}</button>
        <button onClick={() => navigate("notes")}>{t.navNotes}</button>
        <button onClick={() => navigate("about")}>{t.navAbout}</button>
        <button onClick={() => window.location.assign("/studio")}>{t.navStudio}</button>
        <p>{t.mobileTagline}</p>
      </div>
    </>
  );
}

function DetailPage({ project, projectItems, onBack, onOpen, onImageOpen }: { project: Project; projectItems: Project[]; onBack: () => void; onOpen: (project: Project) => void; onImageOpen: (src: string) => void }) {
  const detailRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const nextProject = useMemo(() => projectItems.find((item) => item.id !== project.id) ?? projectItems[0], [project, projectItems]);
  const galleryImages = [assets.signal, assets.archive, assets.tide];

  useEffect(() => {
    let isCurrent = true;
    let context: { revert: () => void } | undefined;
    const initializeMotion = async () => {
      if (!detailRef.current || !processRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!isCurrent) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const selector = gsap.utils.selector(detailRef);
        gsap.from(selector(".detail-hero > *"), { y: 28, opacity: 0, duration: 0.7, stagger: 0.13, ease: "power3.out", clearProps: "transform,opacity" });
        gsap.fromTo(selector(".process-diagram__line"), { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: processRef.current, start: "top 72%", end: "bottom 52%", scrub: 0.65 } });
        gsap.utils.toArray<HTMLElement>(selector(".process-step")).forEach((step) => {
          gsap.from(step, { y: 38, opacity: 0, duration: 0.65, ease: "power3.out", scrollTrigger: { trigger: step, start: "top 78%", once: true }, clearProps: "transform,opacity" });
          gsap.from(step.querySelector(".process-mini"), { scaleX: 0, duration: 0.85, ease: "power3.out", transformOrigin: "left center", scrollTrigger: { trigger: step, start: "top 72%", once: true }, clearProps: "transform" });
        });
      }, detailRef);
    };
    void initializeMotion();
    return () => { isCurrent = false; context?.revert(); };
  }, [project.id]);

  return (
    <main className="detail" ref={detailRef}>
      <section className="page-shell detail-hero">
        <div data-reveal>
          <button type="button" className="back-button" onClick={onBack}><Suspense fallback={<i className="icon-placeholder" aria-hidden="true" />}><DetailBackIcon size={16} /></Suspense> Back to work</button>
          <p className="detail-category">{project.kind}</p>
          <h1 className="detail-title">{project.title}</h1>
          <p className="detail-summary">{project.longDescription}</p>
          <div className="detail-meta">
            <div><span>Role</span><strong>{project.role}</strong></div>
            <div><span>Timeline</span><strong>{project.timeline}</strong></div>
            <div><span>Stack</span><strong>{project.stack}</strong></div>
          </div>
          {(project.liveUrl || project.repository) && <div className="detail-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">Open live service <ArrowUpRight size={15} /></a>}
            {project.repository && <a href={project.repository} target="_blank" rel="noreferrer">View GitHub repository <ArrowUpRight size={15} /></a>}
          </div>}
        </div>
        <div className="detail-visual" data-reveal>
          {project.visual === "studio" ? <div className="studio-visual" /> : <img src={project.image} alt={`${project.title} 프로젝트 대표 이미지`} />}
        </div>
      </section>

      <section className="page-shell case-section" data-reveal>
        <p className="case-label">01 / Overview</p>
        <div className="case-content">
          <h2>{project.problem}</h2>
          <p>{project.title}은 결과물을 더 많이 보여 주기보다, 사용자가 정보 사이에서 방향을 잃지 않도록 경험의 리듬을 다시 설계했습니다. 화면의 모든 변화는 다음 행동을 암시하거나, 이미 존재하는 관계를 더 선명하게 만드는 데 집중합니다.</p>
          <div className="fact-grid">
            <div className="fact"><span>Context</span><strong>Signals distributed across tools, sources, and operating conditions.</strong></div>
            <div className="fact"><span>Challenge</span><strong>Make the next useful state visible without amplifying noise.</strong></div>
            <div className="fact"><span>Response</span><strong>Pair a reliable system boundary with a calm, inspectable interface.</strong></div>
          </div>
        </div>
      </section>

      <section className="page-shell case-section principle" data-reveal>
        <div className="principle-visual" aria-label="거리와 반응을 추상적으로 표현한 시각물" />
        <div className="case-content">
          <p className="case-label">02 / Principle</p>
          <h2>{project.principle}</h2>
          <p>중심에 있는 것은 화려한 효과가 아니라, 독자가 가까워진 대상과 아직 멀리 있는 대상의 관계를 자연스럽게 느끼게 만드는 일입니다. 작은 반응은 시선을 잡아두기보다, 다음으로 갈 수 있는 방향을 보여 줍니다.</p>
        </div>
      </section>

      <section className="page-shell case-section process-section" data-reveal ref={processRef}>
        <p className="case-label">03 / Process</p>
        <div className="case-content">
          <h2>Three decisions shaped the final rhythm.</h2>
          <div className="process-diagram" aria-label="스크롤에 따라 세 단계가 순차적으로 그려지는 프로젝트 프로세스 다이어그램">
            <div className="process-diagram__line" aria-hidden="true" />
            {processSteps.map(([number, title, copy, visual]) => (
              <article className="process-step" key={number}>
                <div className="process-number"><span>{number}</span></div>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <div className={`process-mini process-mini--${visual}`} aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell case-section outcome" data-reveal>
        <div className="outcome-head">
          <p className="case-label">04 / Outcome</p>
          <div className="case-content"><h2>{project.outcome}</h2></div>
        </div>
        <div className="gallery-main">
          <img src={project.image ?? assets.signal} alt={`${project.title}의 전체 인터페이스 결과물`} />
          <button onClick={() => onImageOpen(project.image ?? assets.signal)}><Suspense fallback={<i className="icon-placeholder" aria-hidden="true" />}><DetailZoomIcon size={15} /></Suspense> View image</button>
        </div>
        <p className="gallery-caption">The entry point turns a long read into a field of connected signals. It is designed to invite exploration without turning every movement into a demand.</p>
        <div className="gallery-row">
          {galleryImages.slice(1).map((image, index) => <button className="gallery-item" key={image} onClick={() => onImageOpen(image)} aria-label={`결과물 이미지 ${index + 2} 확대 보기`}><img src={image} alt="" /></button>)}
        </div>
      </section>

      <section className="page-shell case-section reflection" data-reveal>
        <p className="case-label">05 / Reflection</p>
        <div className="case-content">
          <h2>The best alert is the one that preserves attention.</h2>
          <p>이 작업들에서 반복해서 확인한 원칙은 단순합니다. 정보가 많아질수록 더 많은 신호를 보내는 대신, 무엇이 지금 바뀌었고 사용자가 언제 다시 개입해야 하는지를 조용히 드러내야 합니다. 이 원칙은 수집 서비스와 개발자 도구 모두에 이어집니다.</p>
        </div>
      </section>

      <button className="page-shell next-project" onClick={() => onOpen(nextProject)} aria-label={`다음 프로젝트 ${nextProject.title} 보기`}>
        {nextProject.image ? <img src={nextProject.image} alt="" /> : <div className="studio-visual" />}
        <span className="next-copy"><p>Next project</p><h2>{nextProject.title}</h2><span>Explore next <ArrowUpRight size={15} /></span></span>
      </button>
    </main>
  );
}

export default function Home() {
  const { lang } = useLang();
  const t = UI[lang];
  const [theme, setTheme] = useState<"dark" | "light">(() => document.documentElement.classList.contains("light") ? "light" : "dark");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [imageOverlay, setImageOverlay] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("LOADING FIELD");
  const [deferredSectionsReady, setDeferredSectionsReady] = useState({ orbit: false, domains: false });
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLElement>(null);
  const scrollRailRef = useRef<HTMLSpanElement>(null);
  const projectItems = useMemo<Project[]>(() => [...projects], []);

  useEffect(() => {
    const workId = new URLSearchParams(window.location.search).get("work");
    const linkedProject = projectItems.find((project) => project.id === workId);
    if (linkedProject) window.location.replace(`/work/${getProjectSlug(linkedProject)}`);
  }, [projectItems]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("onepaperhoon-theme-v2", theme);
  }, [theme]);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); }), { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [selectedProject, deferredSectionsReady]);

  useEffect(() => {
    document.title = selectedProject ? `${selectedProject.title} — onepaperhoon` : "onepaperhoon — Interfaces with a pulse";
  }, [selectedProject]);

  useEffect(() => {
    let isCurrent = true;
    let dispose: () => void = () => {};
    const initializeMotion = async () => {
      if (selectedProject || !heroRef.current || !workRef.current || !notesRef.current) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!isCurrent) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (context) => {
      if (context.conditions?.reduced) return;

      const selector = gsap.utils.selector(pageRef);
      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTimeline
        .from(selector(".hero-reveal"), { y: 34, duration: 0.78, stagger: 0.14, clearProps: "transform" })
        .from(selector(".scroll-rail"), { opacity: 0, duration: 0.35 }, "-=0.42");

      gsap.to(heroRef.current, {
        "--hero-scroll": 1,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.65 },
      });
      if (scrollRailRef.current) {
        gsap.set(scrollRailRef.current, { scaleY: 0, transformOrigin: "top" });
        gsap.to(scrollRailRef.current, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: document.documentElement, start: "top top", end: "max", scrub: 0.25 },
        });
      }

      gsap.to(workRef.current, {
        "--section-progress": 1,
        ease: "none",
        scrollTrigger: { trigger: workRef.current, start: "top 86%", end: "top 32%", scrub: 0.55 },
      });
      gsap.fromTo(selector(".project-card"), { opacity: 0, y: 54, scale: 0.985 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.78, ease: "power3.out", stagger: 0.11,
        scrollTrigger: { trigger: workRef.current, start: "top 72%", once: true },
        onComplete: () => gsap.set(selector(".project-card"), { clearProps: "transform,opacity" }),
      });

      gsap.from(selector(".playground-item"), {
        opacity: 0, y: 34, duration: 0.65, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: ".playground-section", start: "top 72%", once: true },
        onComplete: () => gsap.set(selector(".playground-item"), { clearProps: "transform,opacity" }),
      });
      gsap.to(notesRef.current, {
        "--notes-scroll": 1,
        ease: "none",
        scrollTrigger: { trigger: notesRef.current, start: "top 85%", end: "top 32%", scrub: 0.55 },
      });
      gsap.from(selector(".note-row"), {
        opacity: 0, x: 34, duration: 0.58, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: notesRef.current, start: "top 65%", once: true },
        onComplete: () => gsap.set(selector(".note-row"), { clearProps: "transform,opacity" }),
      });
      });
      dispose = () => mm.revert();
    };
    void initializeMotion();
    return () => { isCurrent = false; dispose(); };
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject || !deferredSectionsReady.orbit || !orbitRef.current) return;
    let isCurrent = true;
    let dispose: () => void = () => {};
    const initializeOrbitMotion = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!isCurrent || !orbitRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const selector = gsap.utils.selector(orbitRef);
        gsap.to(orbitRef.current, { "--orbit-scroll": 1, ease: "none", scrollTrigger: { trigger: orbitRef.current, start: "top 84%", end: "top 24%", scrub: 0.62 } });
        gsap.from(selector(".orbit-intro > *"), { opacity: 0, x: -26, duration: 0.62, stagger: 0.09, ease: "power3.out", scrollTrigger: { trigger: orbitRef.current, start: "top 68%", once: true }, onComplete: () => gsap.set(selector(".orbit-intro > *"), { clearProps: "transform,opacity" }) });
        gsap.from(selector(".orbit-stage"), { opacity: 0, scale: 0.88, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: orbitRef.current, start: "top 66%", once: true }, onComplete: () => gsap.set(selector(".orbit-stage"), { clearProps: "transform,opacity" }) });
      });
      dispose = () => mm.revert();
    };
    void initializeOrbitMotion();
    return () => { isCurrent = false; dispose(); };
  }, [deferredSectionsReady.orbit, selectedProject]);

  useEffect(() => {
    if (selectedProject || !deferredSectionsReady.domains) return;
    let isCurrent = true;
    let dispose: () => void = () => {};
    const initializeDomainMotion = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!isCurrent) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const selector = gsap.utils.selector(pageRef);
        gsap.from(selector(".domain-card"), { opacity: 0, y: 34, duration: 0.62, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".domains-section", start: "top 72%", once: true }, onComplete: () => gsap.set(selector(".domain-card"), { clearProps: "transform,opacity" }) });
      });
      dispose = () => mm.revert();
    };
    void initializeDomainMotion();
    return () => { isCurrent = false; dispose(); };
  }, [deferredSectionsReady.domains, selectedProject]);

  const runTransition = (label: string, action: () => void) => {
    setTransitionLabel(label);
    setIsTransitioning(true);
    window.setTimeout(() => {
      action();
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => setIsTransitioning(false), 180);
    }, 420);
  };

  const openProject = (project: Project) => {
    runTransition(`OPENING ${project.title.toUpperCase()}`, () => {
      window.location.assign(`/work/${getProjectSlug(project)}`);
    });
  };

  const navigate = (id: string) => {
    if (id === "home" && selectedProject) { runTransition("RETURNING TO INDEX", () => { window.history.pushState({}, "", "/"); setSelectedProject(null); }); return; }
    if (id === "home") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (selectedProject && ["work", "orbit", "domains", "playground", "notes", "about"].includes(id)) { runTransition(`RETURNING TO ${id.toUpperCase()}`, () => { window.history.pushState({}, "", "/"); setSelectedProject(null); window.setTimeout(() => scrollToId(id), 50); }); return; }
    if (!selectedProject) scrollToId(["orbit", "domains", "playground", "notes", "about"].includes(id) ? id : "work");
  };

  return (
    <div ref={pageRef} className="app-shell">
      <div className="noise" />
      {!selectedProject && <div className="scroll-rail" aria-hidden="true"><span ref={scrollRailRef} /></div>}
      <Header theme={theme} toggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} onNavigate={navigate} isDetail={Boolean(selectedProject)} />
      {selectedProject ? <DetailPage project={selectedProject} projectItems={projectItems} onBack={() => navigate("work")} onOpen={openProject} onImageOpen={setImageOverlay} /> : (
        <main className="home">
          <section className="page-shell hero" ref={heroRef}>
            <div className="hero-reveal">
              <p className="eyebrow">{t.heroEyebrow}</p>
              {lang === "ko" ? <h1>맥박이 뛰는<br /><em>인터페이스</em>.</h1> : <h1>Interfaces<br />with a <em>pulse</em>.</h1>}
            </div>
            <div className="hero-copy hero-reveal">
              {lang === "ko"
                ? <p>흩어진 정보와 비동기 작업을 <strong>신뢰할 수 있는 상태와 조용한 신호</strong>로 바꾸는 서비스를 만듭니다.</p>
                : <p>I build services that turn scattered information and asynchronous work into <strong>trustworthy state and quiet signals</strong>.</p>}
              <button className="scroll-note" onClick={() => scrollToId("work")}><span className="scroll-line" /> {t.scrollNote}</button>
            </div>
          </section>

          <section className="page-shell work-section" id="work" ref={workRef}>
            <div className="section-kicker"><strong>{t.workKicker}</strong><span>{t.workKickerSub}</span></div>
            <div className="project-grid">
              {projectItems.map((project) => <ProjectCard key={project.id} project={project} onOpen={openProject} />)}
            </div>
          </section>

          <ViewportDeferredSection id="orbit" className="scroll-orbit-wrap" label="Orbit" placeholderClass="section-chunk-placeholder--orbit"><div ref={orbitRef}><Suspense fallback={<div className="page-shell section-chunk-loading" aria-label="Orbit 영역 준비 중" />}><DeferredOrbitSection onOpen={openProject} projectItems={projectItems} onReady={() => setDeferredSectionsReady((current) => current.orbit ? current : { ...current, orbit: true })} /></Suspense></div></ViewportDeferredSection>

          <ViewportDeferredSection id="domains" label="Live Domains" placeholderClass="section-chunk-placeholder--domains"><Suspense fallback={<div className="page-shell section-chunk-loading" aria-label="Live Domains 영역 준비 중" />}><LiveDomainsSection onReady={() => setDeferredSectionsReady((current) => current.domains ? current : { ...current, domains: true })} /></Suspense></ViewportDeferredSection>

          <section className="page-shell playground-section" id="playground" data-reveal>
            <div className="section-kicker"><strong>{t.playgroundKicker}</strong><span>{t.playgroundKickerSub}</span></div>
            <div className="playground-grid">
              {playgroundItems.map((item) => {
                const Icon = item.icon;
                return <article className={`playground-item playground-item--${item.id}`} key={item.id}>
                  <div className="playground-item__head"><span>{item.id} / {item.label[lang]}</span><Suspense fallback={<i className="icon-placeholder" aria-hidden="true" />}><Icon size={18} /></Suspense></div>
                  <div className="playground-item__artifact" aria-hidden="true"><i></i><i></i><i></i></div>
                  <h2>{item.title}</h2>
                  <p>{item.copy[lang]}</p>
                  <span className="playground-item__link">{t.playgroundOpen} <ArrowUpRight size={15} /></span>
                </article>;
              })}
            </div>
          </section>

          <section className="page-shell notes-section" id="notes" data-reveal ref={notesRef}>
            <div className="notes-heading"><p className="manifesto-label">{t.notesLabel}</p>{lang === "ko"
              ? <h2>짧은 기록이<br />다음 시스템의<br /><span>시작점이 된다.</span></h2>
              : <h2>A short note<br />is where the next<br /><span>system begins.</span></h2>}</div>
            <div className="notes-list">
              {notes.map((note, index) => <article className="note-row" key={note.title.en}><div className="note-row__meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{note.date[lang]}</span><span>{note.read[lang]}</span></div><div><h3>{note.title[lang]}</h3><p>{note.excerpt[lang]}</p></div><ArrowUpRight className="note-row__arrow" size={20} /></article>)}
            </div>
          </section>

          <section className="page-shell manifesto" data-reveal>
            <p className="manifesto-label">{t.manifestoLabel}</p>
            {lang === "ko"
              ? <p className="manifesto-copy">속도를 늦추지 않으면서 <span>생각의 과정을 보여주는</span> 시스템을 만듭니다.</p>
              : <p className="manifesto-copy">I make systems that <span>show their thinking</span> without slowing you down.</p>}
          </section>

          <section className="page-shell contact-block" id="about" data-reveal>
            <div><p className="eyebrow">{t.contactEyebrow}</p>{lang === "ko"
              ? <h2>질문을 가져오세요.<br />함께 그 모양을 찾습니다.</h2>
              : <h2>Bring a question.<br />We’ll find its shape.</h2>}</div>
            <a className="contact-mail" href="mailto:hello@onepaperhoon.com">{t.contactMail} <ArrowUpRight size={17} /></a>
          </section>
          <footer className="page-shell footer"><span>© 2026 onepaperhoon</span><span>{t.footerTagline}</span></footer>
        </main>
      )}
      <div className={`page-transition ${isTransitioning ? "is-active" : ""}`} aria-live="polite" aria-hidden={!isTransitioning}>
        <div className="page-transition__mark"><span></span><span></span><span></span></div>
        <p>{transitionLabel}</p>
      </div>
      {imageOverlay && <div className="image-overlay" role="dialog" aria-modal="true" aria-label="확대된 프로젝트 이미지" onClick={() => setImageOverlay(null)}><img src={imageOverlay} alt="확대된 프로젝트 결과물" onClick={(event) => event.stopPropagation()} /><button className="round-icon overlay-close" onClick={() => setImageOverlay(null)} aria-label="이미지 닫기"><X size={18} /></button></div>}
    </div>
  );
}
