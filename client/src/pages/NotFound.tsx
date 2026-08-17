import { useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return <main className="not-found" aria-labelledby="not-found-title">
    <div className="noise" aria-hidden="true" />
    <div className="not-found__grid" aria-hidden="true"><i /><i /><i /><i /></div>
    <header className="not-found__header">
      <a className="not-found__brand" href="/" aria-label="onepaperhoon 홈으로 이동"><span aria-hidden="true" />onepaperhoon</a>
      <p>Signal Field / route recovery</p>
    </header>
    <section className="not-found__content">
      <p className="not-found__eyebrow">404 / Lost signal</p>
      <div className="not-found__code" aria-hidden="true"><span>4</span><i><b /></i><span>4</span></div>
      <h1 id="not-found-title">여기에는 아직<br /><em>경로가 없습니다.</em></h1>
      <p className="not-found__copy"><code>{location}</code>은 현재 공개된 필드 안에 없습니다. 시작점으로 돌아가거나, 선택한 시스템을 다시 탐색해 보세요.</p>
      <div className="not-found__actions">
        <a className="not-found__primary" href="/">Return to index <span aria-hidden="true">→</span></a>
        <a className="not-found__secondary" href="/#work">Explore selected work <span aria-hidden="true">↘</span></a>
      </div>
    </section>
    <footer className="not-found__footer"><span>ONE / 404</span><span>Seoul, KR · Systems need a way back.</span></footer>
  </main>;
}
