import { localizeProject, type Project } from "@/content/projects";
import { UI, useLang } from "@/lib/i18n";
import { ArrowUpRight, CircleDot } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function OrbitSection({ onOpen, projectItems, onReady }: { onOpen: (project: Project) => void; projectItems: Project[]; onReady: () => void }) {
  const { lang } = useLang();
  const t = UI[lang];
  const orbitProjects = [projectItems[0], projectItems[1], projectItems[3], projectItems[2]].filter(Boolean);
  const orbitClasses = ["orbit-track--signal", "orbit-track--archive", "orbit-track--tools", "orbit-track--tide"];
  const orbitSpeeds = [0.005, -0.007, 0.004, -0.003];
  const [isOrbitPaused, setIsOrbitPaused] = useState(false);
  const [orbitAngles, setOrbitAngles] = useState([54, 212, 318, 142]);
  const orbitPaused = useRef(false);
  const [activePlanetId, setActivePlanetId] = useState<string | null>(null);

  const setOrbitPause = (paused: boolean) => { orbitPaused.current = paused; setIsOrbitPaused(paused); };
  const togglePlanetCard = async (id: string, active: boolean) => {
    setOrbitPause(active);
    const card = document.querySelector<HTMLElement>(`[data-orbit-card="${id}"]`);
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setActivePlanetId(active ? id : null); return; }
    const { Flip } = await import("gsap/Flip");
    const state = Flip.getState(card);
    setActivePlanetId(active ? id : null);
    requestAnimationFrame(() => Flip.from(state, { duration: 0.38, absolute: true, scale: true, fade: true, ease: "power3.out" }));
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame: number;
    let previous = performance.now();
    const orbit = (now: number) => {
      const elapsed = Math.min(now - previous, 48);
      previous = now;
      if (!orbitPaused.current) setOrbitAngles((current) => current.map((angle, index) => (angle + elapsed * orbitSpeeds[index]) % 360));
      frame = requestAnimationFrame(orbit);
    };
    frame = requestAnimationFrame(orbit);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { onReady(); }, [onReady]);

  return <section className="page-shell orbit-section" data-reveal>
    <div className="orbit-intro"><p className="manifesto-label">{t.orbitLabel}</p>{lang === "ko"
      ? <h2>서비스는<br /><span>같은 중심</span>을<br />다른 궤도로 돈다.</h2>
      : <h2>Services orbit<br /><span>the same center</span><br />on different tracks.</h2>}
    {lang === "ko"
      ? <p>현재 운영 중인 작업을 하나의 목록으로 두지 않고, 서로 다른 속도와 역할을 가진 시스템으로 연결합니다. 가까워진 노드에서 각 서비스의 상세 사례로 진입합니다.</p>
      : <p>Live work is not kept as a flat list — it is connected as systems with different speeds and roles. Approach a node to enter each service's case study.</p>}
    <div className="orbit-legend"><span><i /> {t.orbitLegendActive}</span><span><i /> {t.orbitLegendSelected}</span></div></div>
    <div className={`orbit-stage ${isOrbitPaused ? "is-paused" : ""}`} role="group" aria-label="고정 궤도를 따라 서비스 행성이 자동 공전하는 Orbit 지도"><div className="orbit-world"><div className="orbit-ring orbit-ring--outer" aria-hidden="true" /><div className="orbit-ring orbit-ring--middle" aria-hidden="true" /><div className="orbit-ring orbit-ring--inner" aria-hidden="true" /><div className="orbit-starfield" aria-hidden="true"><i /><i /><i /><i /><i /></div><div className="orbit-center"><span>ONE</span><strong>ORBIT</strong><i /></div>{orbitProjects.map((project, index) => {
      const localized = localizeProject(project, lang);
      return <div key={project.id} className={`orbit-track ${orbitClasses[index]}`} style={{ transform: `translate(-50%, -50%) rotate(${orbitAngles[index]}deg)` }}><button type="button" className={`orbit-planet ${activePlanetId === project.id ? "is-active" : ""}`} style={{ transform: `translate(-50%, -50%) rotate(${-orbitAngles[index]}deg)` }} onPointerEnter={() => togglePlanetCard(project.id, true)} onPointerLeave={() => togglePlanetCard(project.id, false)} onFocus={() => togglePlanetCard(project.id, true)} onBlur={() => togglePlanetCard(project.id, false)} onClick={() => onOpen(project)} aria-label={`${project.title} 서비스 상세 보기`}><span className="orbit-planet__body"><CircleDot size={16} /></span><span className="orbit-planet__card" data-orbit-card={project.id}><span className="orbit-planet__type">{localized.kind}</span><strong>{localized.title}</strong><span>{localized.description}</span><em>{t.orbitOpen} <ArrowUpRight size={13} /></em></span></button></div>;
    })}</div><div className="orbit-controls"><span>{isOrbitPaused ? t.orbitPaused : t.orbitRunning}</span></div></div>
  </section>;
}
