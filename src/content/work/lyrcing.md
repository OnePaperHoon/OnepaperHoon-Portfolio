---
title: Lyrcing for Windows
kind: 데스크톱 앱
year: 2026
summary: 지금 듣는 노래의 가사를 박자에 맞춰 별자리, 매거진, 손글씨, 낙하 같은 화면으로 그려 주는 Windows 가사 비주얼라이저. 어떤 플레이어든 그대로 따라갑니다.
paper: 가사는 읽는 글이 아니라, 노래와 같은 속도로 움직이는 화면이어야 한다.
status: shipped
role: Windows 포팅 · 기획 · 개발
timeline: 2026 · Windows 설치 파일 배포
stack: [Tauri 2, Rust, JavaScript, Canvas 2D, WebCodecs]
links:
  repo: https://github.com/OnePaperHoon/lyrcing-releases
cover: /covers/lyrcing.jpg
tint: "#2a2118"
order: 6
---

<p><a class="pill" href="https://github.com/OnePaperHoon/lyrcing-releases/releases/latest/download/Lyrcing-setup.exe">Windows용 내려받기</a></p>

코드 서명이 없는 설치 파일이라 처음 실행할 때 "Windows의 PC 보호" 창이 뜹니다. **추가 정보 → 실행**을 누르면 설치됩니다.

## 문제

가사 앱은 대부분 글자를 위에서 아래로 흘려보내는 데서 끝납니다. 노래는 박자와 감정으로 움직이는데, 화면은 문서처럼 가만히 있습니다. 그리고 Spotify, YouTube Music, 멜론처럼 듣는 곳이 다 다르니 가사 화면도 플레이어마다 따로 놉니다.

## 원칙

> 가사는 읽는 글이 아니라, 노래와 같은 속도로 움직이는 화면이어야 한다.

- 플레이어를 가리지 않습니다. Windows가 알고 있는 "지금 재생 중"을 읽으므로, 어떤 앱으로 듣든 따라갑니다.
- 로그인이나 쿠키가 필요한 비공식 API는 쓰지 않습니다. 공개된 가사 소스만 씁니다.
- 가사 화면을 한 가지로 정하지 않습니다. 곡의 빠르기와 분위기에 맞춰 테마를 고릅니다.

## 만든 것

- **가사 찾기**: LRCLIB, 벅스, NetEase에서 싱크 가사를 찾고, 다른 가수의 같은 제목 곡이 섞이지 않게 가수 이름을 한글과 로마자 사이에서도 맞춰 봅니다.
- **화면 테마**: 2D·3D 별자리, 클래식, 매거진, 키네틱, 손글씨, 그리고 부르는 단어가 떨어져 쌓이는 낙하 테마.
- **단어 이모지**: 한국어, 영어, 일본어, 중국어 가사의 단어를 이모지로 바꿔 함께 띄웁니다 (Fluent Emoji 1,600여 개).
- **소리에 반응**: 스피커 소리에서 박자와 음역대를 읽어 화면이 같이 뜁니다.
- **영상 내보내기**: 원하는 구간을 쇼츠, 피드, 유튜브 비율의 MP4로 만듭니다. 재생되는 소리를 녹음해 같이 넣을 수도 있습니다.
- 전체화면, 미니 창, 작업 표시줄 가사, OBS 오버레이, Discord 상태 표시.
