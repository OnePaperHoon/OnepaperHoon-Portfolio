# OnePaperHoon 공개 GitHub 조사

## 프로필

- 프로필 소개: 서울에서 서비스를 만드는 개발자이며, 흩어진 정보를 한곳에 모아 쓸 만하게 만드는 일을 선호한다.
- 공개 프로필에서 확인한 대표 작업: FeedLine, YenWatch, ClaudeCodeAlert, CodexAlert.
- 프로필에는 TypeScript, C++, Rust, Node, React Native, Cloudflare, D1, Drizzle, SQLite, MongoDB 등의 경험이 표시되어 있다.

## YenWatch / RateBot

- 공개 저장소: <https://github.com/OnePaperHoon/RateBot>
- 개인용 JPY/KRW 환율 모니터링 봇으로, Raspberry Pi에서 상시 실행된다.
- 네이버 금융 데이터를 1분 간격으로 수집하고 Discord 상태 메시지, Notion 데이터베이스, 로컬 SQLite에 기록한다.
- Discord 상태 메시지를 반복 발송하지 않고 한 개의 메시지를 갱신하며, 목표 환율 알림·명령어·상태 보드·장애 복구 흐름을 제공한다.
- 저장소 README에는 TypeScript 기반, pm2 단일 인스턴스 운영, SQLite·Notion·Discord 분리 내결함성, 테스트와 관리 CLI가 문서화되어 있다.

이후 포트폴리오에는 실제 작업을 **정보를 수집·정규화·배포하는 서비스 시스템**이라는 공통 서사로 반영한다.

## ClaudeCodeAlert

Claude Code hook 이벤트에 사운드와 토스트를 표시하는 Windows·macOS용 크로스플랫폼 CLI 라이브러리다. 전역 설치 또는 일회성 실행을 지원하며, 대화형 초기화 과정에서 기존 hook 충돌 확인, 이벤트 선택, 설정 diff 미리보기, 확인 후 적용, 자동 백업, on/off 명령 설치까지 안내한다. 공개 저장소는 TypeScript 중심이며 npm 패키지로 배포된다.

## FeedLine

공개 서비스: <https://feedline.kr>. 국내외 마케팅 RSS를 수집하고 탐색·검색·트렌드·브리핑·소스 상태를 하나의 화면군으로 제공하는 마케팅 인텔리전스 서비스다. 첫 화면에서는 68개 탐색 소스, 64개 자동 수집, 15분 자동 갱신과 함께 AI·SEO·소셜·콘텐츠 주제 탐색을 제시한다.

포트폴리오의 대표 사례는 FeedLine, YenWatch, ClaudeCodeAlert을 중심으로 재편한다. 세 작업 모두 흩어진 신호를 **필요한 맥락과 적절한 알림**으로 바꾸는 문제 해결 방식을 공유한다.

## CodexAlert

공개 저장소: <https://github.com/OnePaperHoon/CodexAlert>. OpenAI Codex CLI lifecycle hook 이벤트에 사운드와 토스트를 표시하는 Windows·macOS용 크로스플랫폼 라이브러리다. `cda init`은 hook 충돌 확인, 이벤트·matcher 선택, diff 확인 후 적용, 자동 백업, Codex 내 음소거 토글 스킬 설치를 지원한다. TypeScript를 중심으로 PowerShell과 Shell을 함께 사용하며 npm 패키지로 제공된다.

ClaudeCodeAlert과 CodexAlert은 하나의 개발자 도구 사례로 묶어, 장시간 비동기 작업의 완료·권한 요청·알림 상태를 **과도한 방해 없이 신호화하는 시스템**으로 표현한다.
