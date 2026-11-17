# onepaperhoon

한장훈의 작업 아카이브 — [onepaperhoon.com](https://onepaperhoon.com)

종이 한 장이 스크롤을 따라다니며 각 섹션의 핵심을 보여주고, 마지막엔 종이비행기로 접혀 날아갑니다.

- **Astro** 정적 사이트 + **three.js** 종이 한 장
- 콘텐츠는 마크다운: `src/content/work/`, `src/content/notes/`
- Contabo VPS의 **Caddy**가 정적 파일을 서빙. `main`에 푸시하면 GitHub Actions가 SSH로 올림

작업·노트 추가, 배포 방법은 [DEPLOY.md](./DEPLOY.md)를 보세요.
