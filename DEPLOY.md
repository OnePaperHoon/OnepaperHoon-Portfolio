# 운영 가이드

Astro로 빌드한 완전 정적 사이트입니다. Worker 코드, DB, 버킷 없이 Cloudflare Workers Static Assets로만 배포합니다.

## 로컬 개발

```sh
pnpm install
pnpm dev                     # 개발 서버 (http://localhost:4321)
pnpm build && pnpm preview   # 프로덕션 빌드 확인
pnpm check                   # 타입·콘텐츠 스키마 검사
```

## 배포

```sh
pnpm exec wrangler login   # 최초 1회
pnpm deploy                # astro build → wrangler deploy
```

`wrangler.jsonc`의 routes에 있는 `onepaperhoon.com` / `www.onepaperhoon.com`은 해당 존이 같은 Cloudflare 계정에 있으면 배포 시 자동 연결됩니다.

Search Console 인증이 필요하면 `.env`의 `VITE_GOOGLE_SITE_VERIFICATION`에 토큰을 넣으세요. 값이 있을 때만 `<meta>`가 들어갑니다.

## 작업(Work) 추가

`src/content/work/<slug>.md` 파일 하나를 만들면 끝입니다. → `/work/<slug>` 페이지, 홈 카드, 히어로 하단 이름, 숫자(만든 것 / 운영 중 / npm), 사이트맵에 자동 반영됩니다.

```md
---
title: 새 프로젝트
kind: 한 줄 분류
year: 2026
summary: 카드와 상세 상단에 나오는 요약.
paper: 종이에 적힐 이 작업의 원칙 한 줄.
status: live # live | shipped | wip
role: 기획 · 개발
timeline: 2026 · 운영 중
stack: [TypeScript]
links:
  live: https://example.com # repo, npm 도 가능
cover: /covers/new-project.jpg # 실제 스크린샷. public/covers/ 에 넣기
# cover 가 없으면 아래 줄들로 터미널 커버를 그립니다
# terminal:
#   - "$ npx something"
tint: "#1b1a2e" # 카드 배경색
order: 6 # 작을수록 앞
featured: false # true 면 홈의 대표 작업 자리에 들어갑니다 (cover 필요)
---

## 문제

본문은 마크다운으로 자유롭게.
```

필드 설명과 검증 규칙은 `src/content.config.ts`에 있습니다. 필드를 빠뜨리면 빌드가 어떤 파일의 무엇이 틀렸는지 알려줍니다.

## 노트(Notes) 쓰기

`src/content/notes/<slug>.md`:

```md
---
title: 글 제목
summary: 목록에 보이는 한두 문장.
date: 2026-09-21
tags: [astro]
draft: false # true 면 어디에도 노출되지 않습니다
---

본문.
```

→ `/notes/<slug>`, `/notes` 목록, 홈의 최근 기록, `/rss.xml`에 반영됩니다. 공개된 노트가 하나도 없으면 홈의 기록 섹션은 자동으로 숨겨집니다.

## 종이 (three.js)

- 페이지 어디든 `<PaperSlot label title body tilt shadow />`를 놓으면 종이가 그 자리로 날아와 앉아 그 문구를 보여줍니다. 슬롯 사이는 스크롤 진행도로 이어집니다.
- `fold="plane"`인 슬롯(푸터)에 가까워지면 종이비행기로 접힙니다. 그 비행기는 누르거나(터치·키보드 포함) 마우스로 잡아 던지면 점선 궤적을 남기며 날아가고, 새 종이가 내려와 다시 접힙니다. `data-paper-launch`를 단 요소(메일 버튼)를 눌러도 날아갑니다.
- 페이지를 이동해도(`<ClientRouter />`) 캔버스는 `#paper-root`에 유지되어 같은 종이가 다음 페이지의 슬롯으로 날아갑니다. 작업 카드와 상세 페이지 슬롯은 문구가 같아서 뒤집히지 않고 그대로 넘어갑니다. 이 때문에 페이지마다 실행할 스크립트는 `astro:page-load` 이벤트에 걸어야 합니다.
- `backlit`(0~1)을 주면 해를 등진 자리처럼 반대쪽 면의 인쇄가 거울상으로 비칩니다.
- 홈 히어로의 `.hero-over`는 캔버스 위에 놓인 워드마크 사본으로, "paper" 글자만 보여서 종이가 그 글자 뒤로 지나갑니다. 히어로 문구를 바꾸면 `.hero-over` 안의 사본도 같이 바꿔야 정확히 겹칩니다.
- `data-paper-hover`와 `data-label / data-title / data-body / data-foot`을 가진 요소에 마우스를 올리면 종이가 뒤집혀 그 내용을 보여줍니다 (작업 카드가 이 방식).
- WebGL이 없거나 OS에서 '동작 줄이기'를 켠 경우엔 같은 내용이 CSS 종이 카드로 보입니다.
- 코드: `src/scripts/paper/` — `fold.ts`(메시·접기), `sheet-texture.ts`(종이에 인쇄되는 내용), `stage.ts`(무대·스크롤 추종).

## 하늘과 시간대

- 장면(`.scene`)의 하늘은 셰이더(`src/scripts/sky.ts`)가 그립니다. 콘텐츠 뒤의 캔버스 하나가, 화면에 가장 크게 보이는 `[data-sky]` 상자 자리에만 하늘·구름·해·별을 그립니다 (절반 해상도, 30fps).
- 색은 전부 `src/styles/global.css`의 시간대 팔레트(`--sky-1..4`, `--sun`, `--cloud`, `--clouds`, `--stars`, `--hill-*` …)에서 읽습니다. WebGL이 없거나 '동작 줄이기' 환경에서는 같은 변수로 만든 CSS 그라데이션이 그대로 보입니다.
- **스크롤 = 시간의 흐름.** 첫 장면은 방문자의 지금 시각(새벽 5–9시 / 낮 9–17시 / 노을 17–20시 / 밤), 다음 장면은 그다음 시간대, 푸터는 또 그다음입니다. 장면에 `data-step="0|1|2"`를 주면 됩니다.
- 미리보기: 주소 뒤에 `?now=dawn|day|dusk|night`.

## 터미널 커버

`terminal:` 줄로 그리는 커버(`[data-typed]`)는 화면에 들어올 때 타이핑됩니다. `$ `로 시작하는 줄은 글자 단위로, 나머지는 출력처럼 한 줄씩 찍힙니다 (`src/scripts/terminal.ts`).

## 그 밖에 고칠 곳

- 이름·메일·GitHub·사이트 설명: `src/site.ts`
- 색·폰트·여백: `src/styles/global.css` 맨 위 `:root`
- 홈 문구: `src/pages/index.astro`
