---
title: ClaudeCodeAlert
kind: 개발자 도구
year: 2026
summary: Claude Code hook 이벤트에 사운드와 토스트 알림을 붙여주는 크로스플랫폼 CLI. Windows / macOS 지원.
paper: 오래 걸리는 작업이 나를 다시 부르게 하되, 방해하지는 않게.
status: shipped
role: CLI UX · TypeScript · 릴리스
timeline: 2026 · npm 배포
stack: [TypeScript, Node.js, PowerShell, Shell]
links:
  repo: https://github.com/OnePaperHoon/ClaudeCodeAlert
  npm: https://www.npmjs.com/package/claude-code-alert
terminal:
  - "$ npm install -g claude-code-alert"
  - "$ cca init"
  - ""
  - "? 알림 받을 이벤트  Stop, Notification"
  - "? 기존 hook 발견    Append / Skip / Abort"
  - "✓ settings.json 백업 완료"
tint: "#3a2418"
order: 4
---

## 문제

Claude Code에 긴 작업을 맡기고 다른 창으로 넘어가면, 작업이 끝났는지, 입력을 기다리는지 알 길이 없습니다. 주의는 이미 다른 곳에 가 있습니다.

## 원칙

> 오래 걸리는 작업이 나를 다시 부르게 하되, 방해하지는 않게.

그리고 남의 설정 파일을 건드리는 도구는 **겸손해야** 합니다. 우리가 만들지 않은 hook은 절대 손대지 않습니다.

## 만든 것

`cca init` 한 번이면 대화형으로 설치됩니다.

1. `~/.claude/settings.json`에 이미 등록된 hook을 감지하고 충돌 처리 방식을 묻습니다 (Append / Skip / Abort).
2. 알림 받을 이벤트를 고르고, 원하면 이벤트별로 사운드와 메시지를 따로 설정합니다.
3. 변경 내용(diff)을 **미리 보여주고**, 확인을 받은 뒤에만 적용합니다.
4. `settings.json`을 자동 백업합니다 (최근 3개 유지).
5. 세션 안에서 바로 끄고 켤 수 있도록 `/cca-off`, `/cca-on` 슬래시 커맨드를 함께 설치합니다.

작은 dispatcher 스크립트 하나가 설정 파일을 읽어 토스트와 사운드를 띄우는 구조라서, 알림을 바꾸고 싶을 때 `settings.json`을 다시 건드릴 필요가 없습니다.

## 결과

npm에 `claude-code-alert`로 배포했습니다. `cca uninstall`은 우리 dispatcher를 가리키는 hook만 골라서 제거합니다.
