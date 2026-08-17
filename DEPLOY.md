# Cloudflare 배포 가이드

완전 정적 사이트입니다 — Worker 코드, DB, 버킷 없이 Cloudflare Workers Static Assets로만 배포합니다.

## 로컬 개발

```sh
pnpm install
pnpm dev                # 개발 서버
pnpm build && pnpm preview   # 프로덕션 빌드 확인
```

## 배포

```sh
pnpm exec wrangler login   # 최초 1회
pnpm deploy
```

`*.workers.dev` 주소로 먼저 확인할 수 있고, `wrangler.jsonc`의 routes에 설정된
`onepaperhoon.com` / `www.onepaperhoon.com` 커스텀 도메인은 해당 존이 이
Cloudflare 계정에 등록되어 있으면 배포 시 자동 연결됩니다.

배포 전에 `.env`의 `VITE_GOOGLE_SITE_VERIFICATION`을 실제 Search Console
토큰으로 교체하세요 (빌드 시 HTML `<meta>`에 들어갑니다).

## 작업물(Work) 추가/수정

`client/src/content/projects.ts`의 `projects` 배열에 항목을 추가·수정한 뒤
`pnpm deploy` 하면 됩니다. 파일 상단 주석에 필드 설명이 있습니다.

- 커버 이미지: `client/public/manus-storage/`에 파일을 넣고
  `image: "/manus-storage/<파일명>"`으로 참조 (기존 이미지들과 같은 방식)
- `slug`를 지정하면 `/work/<slug>` 상세 페이지가 생깁니다.
  새 상세 페이지는 `client/public/sitemap.xml`에도 URL을 추가해 주세요.

## 구조 메모

- SPA 라우팅: `wrangler.jsonc`의 `not_found_handling: "single-page-application"`이
  모든 미지정 경로를 `index.html`로 보냅니다.
- 예전 Manus 시절 이미지 URL 호환을 위해 이미지는
  `client/public/manus-storage/`에 둡니다 (자세한 내용은 그 폴더의 README).
