# Update Validation

데스크톱 전체 화면과 모바일 전체 화면에서 Orbit 서비스 지도, Playground, Notes, 다크 기본 테마, 고정 내비게이션을 확인했다. 프로젝트 카드·Orbit 노드에는 상세 페이지 전환을 실행하는 버튼과 로딩 상태가 연결되어 있다.

브라우저 자동 클릭은 세션 가용성 오류로 완료하지 못했으나, 타입 검사와 프로덕션 빌드는 통과했다. 로딩 오버레이는 프로젝트 전환 시 `OPENING {PROJECT}` 또는 인덱스 복귀 시 해당 상태 레이블을 표시하도록 구현되어 있다.

## Orbit refinement verification

Orbit 내비게이션으로 이동해 사각형 서비스 노드가 제거된 것을 확인했다. 현재 Signal·Archive·Tools for Thought·Tide는 서로 다른 크기의 원형 행성으로 배치되어 있으며, 세 개의 눌린 타원 궤도와 중심 Orbit 행성 주변을 도는 형태로 표시된다. 각 행성 버튼에는 접근 가능한 서비스 상세 진입 레이블이 존재하며, 포인터·키보드 포커스에서만 상세 카드가 나타나도록 구현되어 있다.

Signal 행성의 실제 화면 좌표와 상세 카드 기본 상태를 확인했다. 카드의 기본 불투명도는 `0`이며, 행성에 포인터 또는 키보드 포커스가 놓일 때만 보이도록 CSS 상태가 연결되어 있다.

Signal 행성의 정확한 위치에 포인터를 올렸을 때, 행성 크기와 글로우가 증가하고 위쪽의 서비스 상세 카드가 표시되는 것을 화면에서 확인했다.

## 3D Orbit verification

3D Orbit 섹션의 기본 화면에서 눌린 타원 궤도, 중심 행성, 네 개의 서비스 행성, `DRAG TO ROTATE` 안내와 `Reset orbit` 제어가 함께 표시되는 것을 확인했다. 키보드 사용자는 Orbit 무대에 포커스한 뒤 방향키로 회전하고 Home 키로 기본 각도로 복귀할 수 있도록 구현했다.

브라우저에서 ArrowRight 입력을 실행했을 때 Orbit 무대의 회전 변환이 `rotateZ(-8deg)`에서 `rotateZ(-5.84deg)`로 변경되는 것을 확인했다. 모바일 전체 화면에서도 행성·원근 궤도·재설정 제어가 한 화면 내에 유지된다.

## Auto Orbit and content registry verification

Orbit은 자동 회전 상태에서 `AUTO ORBIT / HOVER TO PAUSE` 안내를 표시하며, 포인터·포커스·드래그가 시작되면 회전을 멈추도록 구현했다. 브라우저 자동 클릭은 세션 가용성 오류로 완료하지 못했으나, 전체 화면 검토와 타입 검사·프로덕션 빌드는 통과했다.

Selected work 카드, Orbit 행성, 클릭 후 상세 사례는 모두 `client/src/content/projects.ts`의 `projects` 배열을 공유하도록 분리했다. 새 프로젝트 등록 방법은 같은 디렉터리의 `README.md`에 정리했다.

## Top-view Orbit verification

Orbit은 고정된 수직 탑뷰의 동심원 궤도와 개별 공전 행성으로 전환했다. 브라우저 자동 클릭은 세션 가용성 오류로 완료하지 못했으며, 화면 캡처 도구는 애니메이션을 정지 프레임으로 취급하므로 공전 시작 위상을 명시해 정지 상태에서도 행성이 서로 다른 위치에 표시되도록 보완했다.

CSS 애니메이션 대신 화면 좌표를 갱신하는 공전 로직으로 전환한 뒤, 탑뷰 화면에서 고정된 동심원 궤도와 네 개의 분산된 행성이 확인되었다. 행성에 포인터 또는 키보드 포커스가 놓이면 공전 상태를 정지하도록 연결되어 있다.

## GitHub-based portfolio update verification

공개 GitHub 프로필, RateBot, ClaudeCodeAlert, CodexAlert과 FeedLine 공개 서비스를 조사해 실제 프로젝트명·문제·기술·운영 맥락을 반영했다. 전체 화면에서 FeedLine, YenWatch, ClaudeCodeAlert, CodexAlert 카드와 대응 Orbit 행성이 표시되는 것을 확인했다. 상세 화면의 live service·GitHub 링크는 데이터 설정의 `liveUrl`과 `repository`를 기준으로 조건부 표시하도록 구현했으며, 타입 검사와 프로덕션 빌드는 통과했다. 브라우저 자동 클릭은 세션 가용성 오류로 완료하지 못했다.

## Scroll interaction verification

히어로의 깊이 원, Selected systems의 진행선·진입 리듬, Orbit의 접근·그림자, Notes의 가로 진입, 화면 우측 스크롤 신호선을 추가했다. 스크롤 값은 requestAnimationFrame으로 CSS 변수만 갱신하며, 모션 감소 환경에서는 추가 변형과 진행 표식을 끈다. 데스크톱 전체 화면과 390px 모바일 전체 화면에서 콘텐츠 흐름과 Orbit·카드·Notes 가독성을 확인했고, 타입 검사와 프로덕션 빌드를 통과했다.

## GSAP motion verification

GSAP 3.15과 React 통합 패키지를 추가하고 `useGSAP()`·`gsap.context()`·`gsap.matchMedia()`로 홈 화면 모션을 구성했다. 히어로는 순차 타임라인, Selected systems는 카드 stagger, Orbit은 소개와 무대 진입, Playground와 Notes는 순차 읽기 리듬, 스크롤 진행선은 ScrollTrigger scrub으로 동작한다. 모션 감소 환경에서는 타임라인을 생성하지 않는다. 데스크톱·모바일 전체 화면 및 타입 검사·프로덕션 빌드를 확인했다.

히어로 타임라인은 CSS의 기존 reveal 상태와 충돌하지 않도록 전용 `hero-reveal` 대상으로 분리했다. 첫 프레임과 전체 화면 캡처에서 제목·소개·작품 카드·Orbit·콘텐츠가 모두 표시되는 것을 재확인했다.

## Work Studio and detail motion verification

`users`와 `works` 테이블을 생성하고, 공개 Work 목록·소유자 전용 Work 생성·수정·삭제 API를 추가했다. Work Studio는 소유자 인증을 통해 작성 폼과 라이브러리를 제공하며, `published` 상태의 작업은 Selected systems·Orbit·상세 사례에 함께 반영된다. Work 입력 검증 테스트, 인증 로그아웃 테스트, 타입 검사, 프로덕션 빌드를 통과했고 데이터베이스 `works` 테이블의 조회도 확인했다.

상세 사례의 Process 섹션에는 ScrollTrigger에 맞춰 세 단계의 세로 신호선이 그려지고 각 단계·미니 시각물이 순차 진입하도록 구현했다. Orbit 행성은 포인터 또는 포커스 진입 시 공전을 멈추며, 카드 상태 변화에 GSAP Flip을 사용해 자연스럽게 전환한다. 브라우저 자동 상세 클릭은 세션 가용성 오류로 완료하지 못했으나, 공개 홈·Work Studio의 데스크톱·모바일 화면과 빌드 결과를 확인했다.

## Work Studio validation fix

선택 URL 값은 서버에서 공백을 제거한 뒤 빈 값으로 허용하고, 클라이언트에서도 저장 전 공백을 정규화한다. 필수 텍스트 길이, slug 형식, 선택 URL 형식을 저장 전에 폼 내 요약과 해당 URL 필드 표시로 안내한다. 빈 선택 URL, 잘못된 URL, slug 규칙을 포함한 입력 검증 테스트 4건과 기존 인증 테스트를 통과했으며, 타입 검사·프로덕션 빌드·Work Studio 화면을 재확인했다.

저장 전 검증을 독립 클라이언트 모듈로 분리했다. 공백 선택 URL이 빈 값으로 정규화되어 API 요청 전 오류 없이 통과하고, 짧은 필수 설명 및 잘못된 선택 URL이 필드별 오류로 반환되는 것을 테스트했다. 표준 테스트 명령은 서버·클라이언트 테스트를 함께 실행하도록 확장했으며, 총 7개 테스트와 타입 검사·프로덕션 빌드를 통과했다.

## Browser interaction verification

실제 Chromium 렌더링에서 Orbit 첫 행성의 포인터 진입과 이탈을 측정했다. 진입 전에는 `is-paused=false`, `is-active=false`, 카드 불투명도 `0`이었고, 진입 후에는 각각 `true`, `true`, `1`로 전환했으며 이탈 후에는 두 상태가 다시 `false`가 되었다. 이는 Orbit 공전 정지와 GSAP Flip 카드 상태 전환이 함께 동작함을 확인한다.

Selected systems 카드를 통해 상세 사례로 진입한 뒤 Process 다이어그램의 세로 신호선을 측정했다. 초기 `scaleY`는 `0`이었고, 스크롤 후 변환 행렬의 세로 배율은 `0.5341`로 증가했으며 세 단계 모두 표시되었다. ScrollTrigger 기반의 순차 신호선 드로잉이 실제 렌더링에서 진행됨을 확인했다.

## Live Domains verification

`feedline.kr`은 공개 페이지에서 마케팅 RSS, 원문 소스, 브리핑과 소스 상태를 제공하는 서비스임을 확인했다. `rouletteside.com`과 `psychicdollop.com`은 아직 공개 페이지 콘텐츠를 확인할 수 없어, 각각 사용자가 지정한 배포 예정 및 추후 출시 상태만 표기했다. 데스크톱(1440px)과 모바일(390px) 전체 화면에서 Feedline·Roulette Side·Psychic Dollop 카드가 모든 도메인·상태·외부 링크와 함께 표시되고, 모바일에서는 카드가 한 열로 정렬되는 것을 확인했다.

## Service identity verification

세 서비스에는 별도 SVG 마크와 브라우저 파비콘 데이터 URI를 추가했다. Feedline은 세 개의 원문 흐름과 신호점, Roulette Side는 포커스된 휠과 활성 위치, Psychic Dollop은 중심을 향하는 직관적 파문으로 표현한다. 데스크톱(1440px)과 모바일(390px) Live Domains 화면에서 세 마크의 크기·색상 대비·카드 내 위계가 유지되는 것을 확인했다. 단위 테스트는 각 서비스의 정체성 이름과 SVG 파비콘 URI를 검증한다.

Live Domains의 `Preview tab icon` 제어를 누르면 현재 탭의 `rel="icon"` 링크가 해당 서비스 SVG 데이터 URI로 교체되도록 연결했다. 실제 Chromium에서 Roulette Side 제어를 실행해 세 개의 미리보기 버튼이 존재하고, `data-service-favicon="rouletteSide"` 및 SVG 데이터 URI가 적용되는 것을 확인했다. 이후 데스크톱·모바일 화면에서도 미리보기 제어와 외부 링크가 카드 내부에서 겹치지 않고 표시됨을 확인했다.

세 버튼을 순차 실행해 Feedline·Roulette Side·Psychic Dollop 각각의 `data-service-favicon` 값과 SVG 데이터 URI 적용을 개별 확인했다. 세 서비스 모두 기대한 브랜드 식별자로 탭 아이콘이 갱신됐다.

## Authenticated Work Studio verification

소유자 세션으로 `/studio`에 접근해 Work Studio 편집기와 라이브러리(`Works / 0`)를 확인했다. 실제 저장·공개 반영 흐름을 확인하기 위해 제목에 `SYSTEM CHECK`가 명시된 일시적 검증 Work를 작성 중이며, 검증 후 삭제할 계획이다.

검증 Work에는 유효한 slug, 카테고리, 짧은 설명, 상세 소개, 역할, 기간, 스택을 입력했다. 필수 입력은 역할·기간·스택 이후 principle·problem·outcome으로 이어지며, image·live·repository URL은 선택 입력으로 표시되는 것을 확인했다.

Draft 상태로 저장한 뒤 `Work saved` 알림과 라이브러리의 `Works / 1`, `DRAFT`, `SYSTEM CHECK — Work Studio verification` 항목을 확인했다. 이는 실제 인증된 생성 흐름과 draft 상태 저장이 정상 동작함을 보여준다.

공개 포트폴리오의 Selected systems와 Orbit에는 Draft 검증 Work가 나타나지 않았고, 데이터베이스 조회에서도 같은 slug의 Work가 `draft` 상태로 저장된 것을 확인했다. 이어 편집기에서 상태를 `Published`로 변경하고 업데이트 요청을 실행했다.

Published 업데이트 후 `Work updated` 알림과 라이브러리의 `PUBLISHED` 상태를 확인했다. 공개 포트폴리오에는 검증 Work가 Selected systems와 Orbit 양쪽에 즉시 나타났으며, draft 필터와 공개 반영 경로가 실제 데이터로 정상 동작함을 확인했다. 임시 Work는 공개 검증 완료 후 삭제한다.

브라우저 연결이 삭제 제어에서 시간 초과되어, 검증을 위해 생성한 정확한 slug와 id 조건의 임시 Work만 데이터베이스에서 정리했다. 독립 Chromium으로 공개 포트폴리오를 다시 확인해 `SYSTEM CHECK — Work Studio verification` 항목이 더 이상 표시되지 않는 것을 검증했다. 따라서 실데이터 흐름은 생성(draft) → 비공개 확인 → published 전환 → 공개 포트폴리오 반영 → 정리까지 완료했다.

## Cover image management verification

인증된 Work Studio의 새 Work 편집기에서 Cover image 영역이 표시되는 것을 확인했다. 파일 선택 UI는 PNG·JPEG·WebP와 최대 5 MB 제한을 명확히 안내하며, 업로드 전 빈 상태에는 `Upload a cover image` 제어와 외부 이미지 URL 입력 대안을 함께 제공한다.

키보드 탐색에서도 Work Studio의 폼 구조와 Cover image 안내가 유지되며, 파일 선택 제어는 새 Work 작성 흐름 안에 포함된다.

데스크톱 전체 화면에서 Cover image 카드가 Stack 다음, Principle 이전에 배치되어 작성 순서를 자연스럽게 유지하는 것을 확인했다. 업로드 빈 상태, 파일 형식·크기 제한, 외부 URL 대안은 기존 Signal Field의 어두운 표면과 라임 신호색 대비를 유지하며 읽기 좋게 표시된다.

모바일(390px) 전체 화면에서는 Work Studio가 한 열 폼으로 전환되고, Cover image 카드의 업로드 제어와 URL 입력이 화면 폭 안에 유지된다. 카드 높이와 텍스트 위계가 작은 화면에서도 분명하게 보이는 것을 확인했다.

커버 이미지 카드에 직접 이동 앵커를 추가해 Work Studio 중간의 파일 선택 영역과 외부 URL 입력을 브라우저에서 확인했다. 업로드 제어는 실제 파일 input을 감싼 라벨 방식으로 동작하도록 구성해, 카드 전체를 클릭하거나 탭으로 접근할 수 있다.

인증된 Studio에서 실제 1×1 PNG 파일을 선택해 업로드했다. 업로드 완료 알림 후 `imageUrl` 입력에는 `/manus-storage/works/1/covers/cover-upload-verification-png_…​.png` 주소가 반영되고, Cover ready 상태와 Replace·Remove 제어가 나타나는 것을 확인했다.

같은 PNG를 Replace 제어로 다시 업로드해 새 해시가 포함된 `/manus-storage/` URL로 갱신되는 것을 확인했다. 이어 Remove를 누르자 Cover ready 미리보기와 URL 값이 사라지고 Upload a cover image 빈 상태가 다시 나타났다. 따라서 파일 업로드, S3 URL 저장, 인라인 미리보기, 교체, 제거의 실제 런타임 상태 전환을 검증했다.

동일한 흐름으로 실제 JPEG와 WebP 파일도 각각 업로드했다. JPEG는 `.jpg`, WebP는 `.webp` 확장자를 유지한 `/manus-storage/works/1/covers/...` URL로 반영되고 Cover ready 미리보기가 표시됐다. WebP 확인 후 Remove를 다시 실행해 Work Studio를 빈 이미지 상태로 복구했다.

## Drag-and-drop and card thumbnail verification

Work Studio의 커버 이미지 영역에 파일을 드롭할 수 있는 안내와 처리 상태를 추가했다. 실제 PNG 업로드에서 원본은 `/manus-storage/works/1/covers/...`로 저장되고, 브라우저 Canvas가 원본 전체를 보존하는 640×400 카드 프레임 썸네일을 자동 생성해 별도 저장한다. 업로드 완료 후 Cover ready 미리보기와 `Card thumbnail generated automatically` 상태가 함께 표시되는 것을 확인했다.

대용량 이미지 데이터 URL이 게이트웨이에서 거부되는 경로를 확인한 뒤, 원본과 생성 썸네일을 인증된 multipart 요청으로 전환했다. 실제 원본은 `/manus-storage/works/1/covers/drag-thumbnail-verification-png_fd66da65.png`, 카드 썸네일은 `/manus-storage/works/1/thumbnails/drag-thumbnail-verification-png-card_e8b5c971.webp`로 각각 성공 저장됐다.

데스크톱(1440px)에서 커버 이미지 업로더는 기존 Work Studio 입력 흐름 안에 넓은 드롭 영역으로 배치되며, `Drop an image here or choose a file` 안내와 5MB·형식 제약을 함께 보여준다. 모바일(390px)에서는 모든 입력과 드롭 영역이 한 열로 전환되고, 업로드 영역이 충분한 터치 높이와 가독성을 유지하는 것을 확인했다.

공개 카드 적용 확인을 위해 사용자 승인을 받아 `card-thumbnail-verification-20260815`라는 임시 검증 Work 입력을 준비했다. 이 항목은 검증 직후 공개 목록과 데이터베이스에서 제거한다.

동일 임시 Work에서 `onepaperhoon-signal-hero.png`를 실제 업로드했다. 화면은 `Preparing cover and thumbnail…` 처리 상태를 거쳐 `Cover ready`와 `Card thumbnail generated automatically.` 상태로 전환됐으며, 원본 커버 URL은 `/manus-storage/works/1/covers/onepaperhoon-signal-hero-png_688fb131.png` 형식으로 폼에 반영됐다. 생성된 썸네일의 공개 카드 적용을 확인한 뒤 검증 레코드와 테스트용 저장 객체를 정리한다.

상대 `/manus-storage/` URL을 허용하도록 클라이언트·서버 검증을 보완한 뒤, 같은 slug의 Published Work를 다시 저장했다. 데이터베이스에는 원본 `/manus-storage/works/1/covers/onepaperhoon-signal-hero-png_c5f4b3c3.png`와 별도 WebP 썸네일 `/manus-storage/works/1/thumbnails/onepaperhoon-signal-hero-png-card_8231c13a.webp`가 함께 저장됐다. 공개 홈의 Selected systems와 Orbit 양쪽에서 `SYSTEM CHECK — Card thumbnail verification` 항목이 표시됐고, Home의 공개 Work 매핑은 `thumbnailUrl`을 전달하며 ProjectCard는 `getProjectCardImage()`로 이를 우선 선택한다.

상기 Published 검증 Work는 공개 목록에서 삭제한 뒤 홈을 새로 고쳐 Selected systems와 Orbit에서 `SYSTEM CHECK — Card thumbnail verification` 항목이 더 이상 보이지 않는 것을 확인했다. 홈 카드의 실제 이미지 `src`를 직접 확인하기 위해 동일 slug의 두 번째 임시 검증 Work를 작성 중이며, 공개 렌더링에서 `/thumbnails/` WebP 경로가 설정됐는지 확인한 즉시 다시 정리한다.

두 번째 Published Work의 공개 홈 DOM에서 `data-project-image-src="/manus-storage/works/1/thumbnails/onepaperhoon-signal-hero-png-card_8e35eab3.webp"`를 직접 확인했다. 즉 실제 Selected systems 카드의 렌더링 `src`는 원본 cover가 아니라 자동 생성된 `/thumbnails/` WebP 경로였다. 검증 직후 해당 Work를 다시 삭제했고, 새로 고친 홈의 Selected systems와 Orbit에는 `SYSTEM CHECK` 항목이 남아 있지 않다.

실제 Chromium 렌더링에서 `dragenter` 이벤트로 드롭 영역이 `Drop image to upload` 및 `Release to create the card thumbnail automatically.` 상태로 전환되는 것을 확인했다. 이어 같은 `DataTransfer`의 PNG 파일을 `drop` 이벤트로 전달하자 `/manus-storage/works/1/covers/drag-runtime-check-png_9164baa8.png` 원본 URL, `Cover ready`, `Card thumbnail generated automatically.` 상태와 성공 알림이 순차적으로 표시됐다. 검증에만 사용한 개발 전용 제어 코드는 즉시 제거했다.

썸네일 스켈레톤 검증을 위해 개발 환경에서만 이미지 완료 상태를 5초 지연하는 경로를 활성화했다. Selected systems 카드가 있는 공개 홈에서 스켈레톤 표시 상태와 이미지 완료 상태를 각각 확인한 뒤 이 검증 경로는 제거한다.

개발 전용 이미지 완료 지연 상태에서 공개 카드 DOM은 각각 `is-thumbnail-loading` 클래스를 가졌고, 스켈레톤이 표시되는 동안 카드 이미지는 투명하게 유지됐다. 완료 후 같은 카드들은 모두 `is-thumbnail-ready`로 전환됐고 이미지가 정상 표시되는 것을 확인했다. 이 검증 경로는 최종 코드에서 제거했으며, 운영 경로는 `img`의 `onLoad`로 즉시 ready 상태가 된다.

Work Studio Preview는 저장 전 `Preview state verification` 입력을 즉시 공개 카드와 Case study 상세 형태로 렌더링했다. 대화상자에서 `Ready to publish`, `3 / 3 registration stages complete`, `Case study / published`, 역할·기간·스택과 자동 선택된 썸네일 커버가 모두 확인됐다. 데이터베이스 저장은 수행하지 않았고, 이 검증에만 사용한 개발 전용 입력 경로는 즉시 제거했다.

빈 Work에서 Preview를 열었을 때 카드에는 `Cover preview` 플레이스홀더, `Untitled work`, `Draft preview`, `Case study / draft`와 세부정보 플레이스홀더가 실제 렌더링됐다. 이어 저장하지 않은 상태에서 제목·설명·상태·커버를 순서대로 변경한 뒤 다시 Preview를 열자 `Live title change`, 변경된 설명, `Ready to publish`, `Case study / published` 및 커버 이미지가 즉시 반영됐다. 저장 작업은 실행하지 않았고, 이 상호작용 검증용 제어도 제거했다.

브라우저가 저장한 Preview DOM에서 빈 상태의 `Untitled work`, `Draft preview`, `Case study / draft`, `Cover preview`를 직접 추출했다. 이어 실제 버튼 클릭으로 변경한 미저장 상태의 DOM에는 `Live title change`, `Live description change should update without saving.`, `Ready to publish`, `Case study / published`, 자동 선택된 `/manus-storage/onepaperhoon-tide_8f18d378.png`가 함께 존재함을 확인했다. 이 상호작용 검증용 개발 제어는 최종 코드에서 제거했다.
