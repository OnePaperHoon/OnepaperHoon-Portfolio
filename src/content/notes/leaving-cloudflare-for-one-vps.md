---
title: Cloudflare를 떠나 VPS 한 대로 전부 옮겼다
summary: 정적 사이트 셋과 Workers·D1 위에서 돌던 FeedLine을 하루 만에 서버 한 대로 옮긴 기록. 무엇이 쉽고 무엇이 발목을 잡았는지.
date: 2026-11-17
tags: [infra, cloudflare, docker, caddy, feedline]
---

11월 3일 하루 동안 Cloudflare에 있던 것을 전부 뺐다. 이 사이트를 포함한 정적 사이트 셋, 그리고 Workers와 D1 위에서 돌던 FeedLine. 지금은 전부 Contabo VPS 한 대에서 Caddy 뒤에 있다.

## 왜

Cloudflare가 나빠서가 아니다. 서비스가 넷으로 늘자 "어디서 뭐가 돌고 있는지"를 한 곳에서 보고 싶어졌다. 이미 Knowmesh가 도커로 도는 서버가 있었고, 거기에 전부 모으면 로그도 백업도 재시작도 한 가지 방법으로 끝난다. 그리고 D1처럼 다른 곳에서 못 쓰는 저장소에 데이터가 묶이는 게 계속 걸렸다.

## 정적 사이트 셋은 한 시간

이 사이트, rouletteside.com, psychicdollop.com은 빌드 결과물이 파일뿐이라 옮길 게 없었다. Caddy에 스니펫 하나를 만들고 도메인마다 세 줄씩 불러 쓴다.

```nginx
(static_site) {
  root * /srv/sites/{args[0]}
  encode zstd gzip
  file_server
}
onepaperhoon.com {
  import static_site onepaperhoon.com
  try_files {path} {path}.html {path}/index.html
}
```

배포는 GitHub Actions가 `dist/`를 tar로 묶어 SSH로 올리고, `/srv/sites/<도메인>.new`에 풀었다가 디렉터리 이름을 바꿔 한 번에 교체한다. Caddy는 같은 경로를 계속 서빙하니 끊기는 순간이 없다. 인증서는 DNS가 서버를 가리키는 순간 Caddy가 알아서 받아 왔다.

## FeedLine은 하루

FeedLine은 Next.js 호환 프레임워크(vinext)로 만든 앱이고, 데이터는 D1에 278MB가 있었다. 걱정했던 것과 달리 앱 코드는 거의 손대지 않았다. 라우트 28곳이 DB를 전부 `D1Database` 타입 하나로만 보기 때문에, 그 인터페이스를 node:sqlite 위에서 똑같이 흉내 내는 파일 하나(137줄)를 두면 나머지는 그대로 돈다. 이 얘기는 [따로 적었다](/notes/d1-adapter-on-node-sqlite).

데이터는 `wrangler d1 export`로 SQL 덤프를 받아(첫 시도는 인증 오류가 났고 그냥 다시 하니 됐다) 서버에서 `sqlite3`로 읽어 들였다. INSERT 22만 줄을 읽는 데 25분. D1이 결국 SQLite라서 SQL을 한 글자도 고칠 일이 없었다.

Workers의 cron 트리거는 컨테이너 하나가 900초마다 같은 파이프라인 함수를 부르는 것으로 바꿨다. 웹 컨테이너와 cron 컨테이너가 SQLite 파일 하나를 같이 쓰므로 WAL 모드가 필수다.

## 발목을 잡은 것들

- **디렉터리 소유자.** 컨테이너는 uid 1000으로 도는데 데이터 디렉터리를 root가 만들어 두면 `unable to open database file`로 재시작만 반복한다. 로그에 권한 얘기가 없어서 한참 봤다.
- **윈도우의 줄바꿈.** 윈도우에서 `git archive`로 내보낸 셸 스크립트가 CRLF라 서버에서 `set -o pipefail`부터 깨졌다. `.gitattributes`로 서버에서 도는 파일은 LF 강제.
- **같은 서비스 이름.** 한 도커 네트워크에 compose 프로젝트 셋이 있고 전부 `web`이라는 서비스가 있었다. Caddy가 `web:3000`으로 보내니 요청의 절반이 엉뚱한 앱으로 갔다. 컨테이너 이름이나 네트워크 alias로 불러야 한다.
- **자기 자신을 검사하는 테스트.** FeedLine 리포에는 배포 워크플로의 단계 이름과 순서를 검사하는 테스트가 있었다. 워크플로를 SSH 배포로 바꾸자 그 테스트가 먼저 떨어졌다. 귀찮았지만 옳은 테스트다. 배포 뒤 공개 URL로 스모크 테스트를 도는 단계는 그대로 살렸다.

## 전환 자체는 40분

호스팅KR에서 네임서버를 바꾸고 18시 8분에 .kr 레지스트리에 반영됐다. 그 직후 Caddy가 인증서를 받았고, 미리 올려 둔 스테이징 DB를 최종 덤프로 교체하고, 공개 URL로 헬스·로그인·피드 페이지를 확인했다. 사이트는 그 사이에도 Cloudflare 쪽에서 계속 서비스 중이었으니 사용자가 느낄 공백은 없었다.

끝나고 Cloudflare 계정에 남은 것은 없다. 서버는 한 대, 배포 방법은 한 가지, 백업할 파일은 SQLite 둘뿐이다.
