---
title: D1 앱을 코드 수정 없이 Node에서 돌리기
summary: Cloudflare D1만 보고 짠 라우트 28개를 한 줄도 고치지 않고 VPS로 옮긴 방법. node:sqlite 위에 D1 인터페이스를 흉내 낸 137줄.
date: 2026-11-17
tags: [feedline, sqlite, node, cloudflare]
---

[Cloudflare를 떠나면서](/notes/leaving-cloudflare-for-one-vps) 가장 겁났던 건 FeedLine의 DB 코드였다. 라우트 28개와 lib 전체가 D1을 직접 부른다. 전부 고치면 며칠이고, 고치다 보면 반드시 하나는 빠뜨린다.

그런데 코드를 다시 보니 앱이 D1에서 쓰는 메서드는 여섯 개뿐이었다. `prepare`, `bind`, `all`, `first`, `run`, `batch`. 그리고 전부 `D1Database`라는 타입 하나를 통해 전역 변수에서 받아 간다. 그렇다면 그 타입을 만족하는 객체를 Node에서 만들어 같은 전역에 꽂으면 된다.

## 137줄

Node 22부터 들어온 `node:sqlite`를 썼다. 별도 네이티브 모듈 설치가 없고, 동기 API라 D1의 비동기 메서드를 감싸기만 하면 된다.

```ts
class SqlitePreparedStatement {
  bind(...values) { return new SqlitePreparedStatement(this.db, this.sql, values.map(toParam)); }
  async all()   { return { results: this.stmt().all(...this.params), success: true, meta }; }
  async first(column?) { const row = this.stmt().get(...this.params); return column ? row?.[column] : row; }
  async run()   { const r = this.stmt().run(...this.params); return { results: [], success: true, meta: { changes: r.changes, last_row_id: r.lastInsertRowid } }; }
}
```

몇 가지는 D1 쪽 버릇을 그대로 따라야 한다.

- **값 변환.** D1은 `undefined`를 null로, boolean을 0/1로, Date를 문자열로 받는다. `bind` 단계에서 똑같이 바꿔 준다. 이걸 빠뜨리면 어느 라우트에서인지 모를 에러가 한참 뒤에 난다.
- **`first(column)`.** 컬럼 이름을 주면 그 값만 돌려준다. 앱이 `SELECT COUNT(*) AS n` 뒤에 `.first("n")`을 꽤 많이 쓴다.
- **`batch`는 한 트랜잭션.** D1의 batch는 하나라도 실패하면 전부 되돌린다. `BEGIN`으로 묶고, 각 문장이 SELECT면 `all`, 아니면 `run`으로 보낸다.
- **`exec` 뒤에는 prepared statement 캐시를 비운다.** 스키마가 바뀌면 캐시해 둔 문장이 낡는다.
- **`meta`.** 앱이 `meta.changes`를 보고 "갱신된 행이 있나"를 판단하는 곳이 있다. 나머지 필드는 모양만 맞춘다.

## 두 프로세스, 파일 하나

Workers에서는 HTTP 요청과 cron이 같은 Worker 안에 있었다. 서버에서는 웹 컨테이너와 cron 컨테이너가 따로 돌고, 둘 다 같은 SQLite 파일을 연다. 그래서 여는 순간 이렇게 둔다.

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

WAL이면 읽기와 쓰기가 서로 막지 않는다. busy_timeout이 없으면 cron이 수집하는 동안 웹 요청이 `SQLITE_BUSY`로 바로 떨어진다. 15분마다 소스 25곳을 긁는 동안에도 페이지가 느려진 적은 없다.

## 앱 코드에 들어간 변경

두 줄이다. Worker 진입점에서 "env에 DB 바인딩이 없으면 전역에 있는 걸 그대로 쓰고 통과"하는 분기 하나, 그리고 프레임워크 설정에 standalone 출력 한 줄. 라우트와 lib는 diff가 없다.

타입이 경계를 지켜 준 덕이다. 앱이 D1의 구체적인 클래스가 아니라 `D1Database` 인터페이스만 봤기 때문에, 그 인터페이스를 만족하는 다른 구현을 끼울 수 있었다. 처음부터 그러려고 설계한 건 아니었는데, 결과적으로 그게 이전 비용의 거의 전부를 없앴다.

## 안 되는 것

`dump()`는 구현하지 않았다. 백업은 SQLite 파일을 그대로 복사하면 되니 필요가 없다. D1의 `withSession()`은 자기 자신을 돌려주는 것으로 때웠다. 읽기 복제본이 없으니 세션 개념이 의미가 없다.
