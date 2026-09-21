---
title: CodexAlert
kind: 개발자 도구
year: 2026
summary: OpenAI Codex CLI의 lifecycle hook 이벤트에 사운드와 토스트 알림을 붙여주는 크로스플랫폼 CLI.
paper: 중요한 전환은 들리게, 그러나 과하지 않게.
status: shipped
role: CLI UX · TypeScript · 플랫폼 연동
timeline: 2026 · npm 배포
stack: [TypeScript, PowerShell, Shell, npm]
links:
  repo: https://github.com/OnePaperHoon/CodexAlert
  npm: https://www.npmjs.com/package/codex-alert
terminal:
  - "$ npx codex-alert init"
  - ""
  - "Basic     Stop ✓  PermissionRequest ✓"
  - "Advanced  PreToolUse  matcher: Bash|apply_patch"
  - ""
  - "! codex 에서 /hooks → trust 를 잊지 마세요"
tint: "#16302b"
demo: cda-init
order: 5
---

## 문제

Codex의 태스크·도구 이벤트는 의미가 있지만, 모든 이벤트를 듣기 시작하면 유용한 신호가 금방 알림 피로로 변합니다.

## 원칙

> 중요한 전환은 들리게, 그러나 과하지 않게.

## 만든 것

- 이벤트를 **Basic**(저빈도, 의미 있는 알림)과 **Advanced**(고빈도, 폭탄 위험)로 나누고, 기본값은 `Stop`과 `PermissionRequest`만 켭니다.
- Advanced 이벤트를 켜면 tool name 정규식(matcher)을 물어서, `Bash|apply_patch`처럼 필요한 도구 호출에만 울리게 합니다.
- `~/.codex/hooks.json`의 기존 hook을 감지하고, diff 미리보기와 자동 백업 뒤에만 적용합니다.
- Codex는 등록 직후의 hook을 trust 처리 전까지 발화하지 않습니다. 그래서 `cda status`의 마지막 줄에 `/hooks` → trust 안내를 항상 표시합니다.
- 세션 안에서 말로 끄고 켤 수 있도록 `cda-off`, `cda-on` 스킬을 함께 설치합니다.

## 결과

npm에 `codex-alert`로 배포했습니다. [ClaudeCodeAlert](/work/claude-code-alert)와 같은 설계 — 자기 hook만 설치하고, 자기 hook만 제거합니다.
