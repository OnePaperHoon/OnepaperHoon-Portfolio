# GSAP 모션 적용 원칙

GSAP는 CSS·SVG·React 등 JavaScript로 제어할 수 있는 대상을 애니메이션할 수 있으며, ScrollTrigger와 `gsap.matchMedia()`를 제공한다. 이 포트폴리오에서는 페이지를 강제로 고정하기보다, 스크롤 구간에서 타임라인·stagger·스크럽 기반의 짧고 의미 있는 반응을 사용한다.

React 가이드는 `useGSAP()`와 `gsap.context()`를 통해 마운트 시 생성된 애니메이션과 ScrollTrigger를 정리할 것을 권장한다. 또한 클릭·포인터 등 나중에 생성되는 모션은 `contextSafe()`로 감싸 정리 범위에 포함한다. 이에 따라 홈 화면 전용 컴포넌트에서 scope를 지정하고, 모션 감소 환경에서는 GSAP 타임라인을 만들지 않는다.

구현 대상은 히어로의 순차 진입, Selected systems 카드의 stagger reveal, Orbit의 궤도·행성 진입, Playground 신호선, Notes의 순차 읽기 리듬이다. 호버·클릭은 기존 카드와 Orbit 상호작용을 유지하며, GSAP는 배치와 강조에만 관여한다.

참고: <https://github.com/greensock/gsap>, <https://gsap.com/resources/React/>.
