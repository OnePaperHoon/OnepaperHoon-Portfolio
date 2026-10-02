---
title: R34의 속을 열어 보는 사이트를 하루 만에 만들었다
summary: 공개된 인터랙티브 자동차 사이트를 가져와 스카이라인 GT-R R34로 바꿨다. 엔진과 구동계는 Blender 스크립트로 직접 모델링하고 렌더했다. 생성형 이미지는 쓰지 않았다.
date: 2026-10-02
tags: [blender, 3d, claude-code, vite]
---

<p><a class="pill" href="/lab/r34/" data-astro-reload>직접 눌러 보기</a></p>

![R34 외관. 노란 점이 누를 수 있는 지점이다](/notes/r34/exterior.jpg)

차 위의 점에 마우스를 올리면 후드가 열리거나 차체가 투명해지고, 누르면 그 부품의 단면도로 들어간다. 색과 휠도 바꿀 수 있다.

## 어디서 시작했나

[motionsites.ai의 VEYRA Electric 프롬프트](https://motionsites.ai/?prompt=veyra-electric)를 보고 시작했다. 원본은 Amir Mušić의 [VEYRA](https://github.com/amirmushichge/veyra-interactive-car)라는 가상의 전기차 디자인 스터디로, 코드가 MIT로 공개되어 있다. 이 사이트의 핵심은 3D를 브라우저에서 돌리지 않는다는 점이다. 미리 만든 정지 이미지와 짧은 영상을 정방향·역방향으로 재생해서 제품 인터페이스처럼 보이게 한다.

원본의 레이아웃, 호버 재생기, 상태 전환, 타이밍은 그대로 두고 **차와 미디어만 전부 바꿨다.** 원본의 이미지와 영상은 생성형 AI로 만든 것인데, 나는 실제 3D 모델을 렌더해서 채우기로 했다.

## 만든 것

<div class="shots">

![후드가 열린 상태](/notes/r34/hood-open.jpg)

![RB26DETT 엔진 단면](/notes/r34/engine.jpg)

![차체가 투명해진 상태](/notes/r34/xray.jpg)

![ATTESA E-TS 구동계](/notes/r34/driveline.jpg)

![6단 변속기 단면](/notes/r34/gearbox.jpg)

![미드나잇 퍼플로 바꾼 모습](/notes/r34/purple.jpg)

</div>

| 원본 VEYRA | 이 버전 |
| --- | --- |
| 전기 구동 유닛 | RB26DETT 엔진 (후드가 열린다) |
| 배터리 투시 | ATTESA E-TS 사륜구동 (차체가 투명해진다) |
| 없음 | 6단 변속기 단면을 다섯 번째 지점으로 추가 |
| 콘셉트 컬러 5종 | 베이사이드 블루, 미드나잇 퍼플, 밀레니엄 제이드, 스파클링 실버, 블랙 펄 |
| 휠 디자인 3종 | 순정 6스포크의 마감 3종 (브론즈, 실버, 유광 블랙) |

## 엔진은 직접 만들어야 했다

구한 R34 모델은 게임용 저폴리곤 모델이었다. 엔진룸에는 텍스처로 구운 납작한 엔진이 있었고, 바닥은 판 한 장이었다. 변속기도 구동축도 없었다.

<div class="shots">

![원본 모델의 차체를 벗긴 모습. 엔진이 납작한 덩어리다](/notes/r34/making-original-engine.jpg)

![원본 모델의 바닥. 구동계가 없다](/notes/r34/making-underside.jpg)

</div>

그래서 구운 엔진을 지우고, 엔진·변속기·트랜스퍼 케이스·프로펠러 샤프트·디퍼렌셜·하프 샤프트를 Blender 파이썬 스크립트로 새로 모델링했다. 실린더 간격 같은 치수를 미터 단위로 적고 기본 도형을 조합하는 방식이다. 배치와 비율은 실제 차를 따랐지만 **닛산의 실측 형상이 아니라 설명용 재구성**이다. 단면도도 내부를 단순화했다.

모든 장면은 카메라 하나를 고정해 놓고 렌더했다. 그래야 정지 이미지와 영상의 처음·끝 프레임이 정확히 겹쳐서, 호버했다가 뗄 때 화면이 튀지 않는다. 되돌아가는 영상은 따로 만들지 않고 정방향 렌더를 거꾸로, 조금 빠르게 재생한 것이다.

## 쓴 도구

작업은 Claude Code에 맡기고 나는 방향을 정하고 결과를 확인했다.

| 도구 | 용도 |
| --- | --- |
| Claude Code | 전체 진행: 검색, 스크립트 작성, 명령 실행, 결과 확인 |
| Git | 원본 VEYRA v1.0.0 클론 |
| GitHub CLI | 코드 검색으로 R34 모델 파일(GLB)이 올라간 저장소 찾기 |
| curl | 모델 다운로드, Sketchfab 공개 API로 라이선스 확인 |
| 웹 검색 | R34·엔진·변속기 3D 모델 후보 찾기 |
| Blender 5.2 (화면 없이 파이썬으로 실행) | 모델 가져오기, 후드 분리, 재질 교체, 엔진·변속기·구동계 모델링 |
| Cycles (RTX 4070 Ti + OptiX) | 정지 이미지와 영상 프레임 렌더, 노이즈 제거 |
| ffmpeg | PNG 프레임을 60fps H.264 mp4로 인코딩 (정방향·역방향) |
| ImageMagick | 투명 배경 렌더를 스튜디오 배경에 합성, 리사이즈 |
| Node.js 24 · pnpm | 사이트 실행, 테스트, 빌드 |
| Vite + React + TypeScript + Tailwind | 원본 사이트의 스택 그대로 |
| Chrome + puppeteer-core | 헤드리스 브라우저로 6개 해상도에서 클릭·호버·스크린샷 검증 |

새로 설치한 것은 puppeteer-core와 사이트의 npm 의존성뿐이고, 나머지는 PC에 있던 것을 썼다.

## 한계

- 모델이 저폴리곤이라 가까이 보면 각진 면과 구운 텍스처가 보인다.
- 휠은 디자인이 하나뿐이라 마감만 바뀐다.
- 지점이 다섯 개가 되면서 폰 화면에서는 터치 영역끼리 꽤 가깝다.

## 출처

- 사이트 원본: [VEYRA](https://github.com/amirmushichge/veyra-interactive-car) — Amir Mušić, MIT 라이선스. 콘셉트와 인터랙션 설계는 그의 것이다.
- 3D 모델: ["Nissan Skyline GT-R V-Spec II (R34)"](https://sketchfab.com/3d-models/2002-nissan-skyline-gt-r-r34-v-spec-ii-385220e90764403daaa1823296d40b54) — supercarmodels, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 후드를 분리하고, 재질을 바꾸고, 구운 엔진을 지우고 구동계를 새로 넣었다.
- Nissan, Skyline, GT-R, RB26DETT, ATTESA E-TS는 각 소유자의 상표다. 이 페이지는 제조사와 관계없는 비공식·비상업 팬 스터디다.
