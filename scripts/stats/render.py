#!/usr/bin/env python3
"""goaccess JSON(합산 1개 + 사이트별 N개) → 한국어 한 장 대시보드 HTML.
사용: render.py <out.html> <combined.json> <domain>=<json> [<domain>=<json> ...]
"""
import json, sys, html, datetime, re
# 취약점 탐색 봇이 두드리는 주소는 인기 페이지에서 뺀다
PROBE = re.compile(r"\.(php|asp|aspx|env|git|sql|bak|xml|txt)$|^/(wp-|wordpress|cgi-bin|vendor|\.|admin|phpmyadmin|xmlrpc)", re.I)

OUT = sys.argv[1]
combined = json.load(open(sys.argv[2], encoding="utf-8"))
sites = {}
for arg in sys.argv[3:]:
    domain, path = arg.split("=", 1)
    try:
        sites[domain] = json.load(open(path, encoding="utf-8"))
    except Exception:
        sites[domain] = None

KST = datetime.timezone(datetime.timedelta(hours=9))
now = datetime.datetime.now(KST)
today = now.strftime("%Y%m%d")
days = [(now - datetime.timedelta(days=i)).strftime("%Y%m%d") for i in range(29, -1, -1)]
d7 = set(days[-7:])
OWN = set(sites.keys()) | {"www." + d for d in sites}

def panel(data, name):
    return (data or {}).get(name, {}).get("data", []) or []

def daily(data):
    """날짜 → (방문자, 페이지뷰)"""
    out = {}
    for row in panel(data, "visitors"):
        out[row["data"]] = (row["visitors"]["count"], row["hits"]["count"])
    return out

def sums(dm, keys):
    v = sum(dm.get(k, (0, 0))[0] for k in keys)
    h = sum(dm.get(k, (0, 0))[1] for k in keys)
    return v, h

def esc(s):
    return html.escape(str(s))

def fmt(n):
    return f"{n:,}"

def merge(rows):
    """goaccess 는 같은 주소도 메서드·프로토콜(HTTP/1.1, HTTP/3)별로 나눠 준다. 주소 기준으로 합친다."""
    out = {}
    for r in rows:
        key = r["data"]
        if key not in out:
            out[key] = {"data": key, "hits": {"count": 0}, "visitors": {"count": 0}}
        out[key]["hits"]["count"] += r["hits"]["count"]
        out[key]["visitors"]["count"] += r["visitors"]["count"]
    return sorted(out.values(), key=lambda r: (-r["visitors"]["count"], -r["hits"]["count"]))

def bar_rows(rows, label_fn, max_items=8, unit="명"):
    rows = merge(rows)[:max_items]
    if not rows:
        return '<p class="empty">아직 기록이 없습니다.</p>'
    top = max(r["visitors"]["count"] for r in rows) or 1
    out = ['<ol class="bars">']
    for r in rows:
        v = r["visitors"]["count"]
        out.append(
            f'<li><span class="bars__label" title="{esc(r["data"])}">{label_fn(r)}</span>'
            f'<span class="bars__track"><i style="width:{v / top * 100:.1f}%"></i></span>'
            f'<span class="bars__num">{fmt(v)}<small>{unit}</small></span></li>'
        )
    out.append("</ol>")
    return "".join(out)

# ---- 합산 숫자
cd = daily(combined)
t_v, t_h = sums(cd, [today])
w_v, w_h = sums(cd, d7)
m_v, m_h = sums(cd, days)

# ---- 일별 그래프 (SVG)
W, H, PAD = 900, 180, 24
top = max([cd.get(k, (0, 0))[0] for k in days] + [1])
bw = (W - PAD * 2) / len(days)
svg = [f'<svg viewBox="0 0 {W} {H + 30}" class="chart" role="img" aria-label="최근 30일 일별 방문자">', f'<line x1="{PAD}" y1="{H}" x2="{W - PAD}" y2="{H}" />']
for i, k in enumerate(days):
    v = cd.get(k, (0, 0))[0]
    h = (H - PAD) * v / top
    x = PAD + i * bw
    cls = ' class="is-today"' if k == today else ""
    svg.append(f'<rect{cls} x="{x + 2:.1f}" y="{H - h:.1f}" width="{bw - 4:.1f}" height="{h:.1f}" rx="3"><title>{k[:4]}-{k[4:6]}-{k[6:]} · 방문자 {v}명 · 페이지뷰 {cd.get(k, (0, 0))[1]}</title></rect>')
    if v:
        svg.append(f'<text x="{x + bw / 2:.1f}" y="{H - h - 6:.1f}" text-anchor="middle" class="chart__val">{v}</text>')
    if i % 5 == 0 or k == today:
        svg.append(f'<text x="{x + bw / 2:.1f}" y="{H + 20}" text-anchor="middle" class="chart__day">{int(k[4:6])}/{int(k[6:])}</text>')
svg.append("</svg>")

# ---- 사이트별 표 + 인기 페이지
site_rows, site_pages = [], []
for domain, data in sites.items():
    dm = daily(data)
    tv, th = sums(dm, [today]); wv, wh = sums(dm, d7); mv, mh = sums(dm, days)
    site_rows.append(f"<tr><th><a href=\"https://{esc(domain)}\" target=\"_blank\" rel=\"noreferrer\">{esc(domain)}</a></th><td>{fmt(tv)}</td><td>{fmt(wv)}</td><td><b>{fmt(mv)}</b></td><td>{fmt(mh)}</td></tr>")
    pages = [r for r in panel(data, "requests") if r["data"] not in ("/robots.txt", "/sitemap-index.xml", "/sitemap-0.xml", "/rss.xml", "/favicon.svg") and not PROBE.search(r["data"])]
    site_pages.append(f'<section class="paper"><p class="paper__label">Pages<small>30일</small></p><h3 class="paper__title">{esc(domain)}</h3>{bar_rows(pages, lambda r: esc(r["data"]))}</section>')

# ---- 유입 경로 / 브라우저 / 기기
refs = [r for r in panel(combined, "referring_sites") if r["data"] not in OWN]
browsers = [r for r in panel(combined, "browsers") if r["data"] not in ("Others", "Crawlers", "Unknown")]
oses = [r for r in panel(combined, "os") if r["data"] not in ("Unknown", "Crawlers")]
os_label = {"Windows": "Windows", "macOS": "Mac", "iOS": "iPhone·iPad", "Android": "Android", "Linux": "Linux", "Chrome OS": "Chromebook"}

doc = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>방문 통계 — onepaperhoon</title>
<link rel="icon" type="image/svg+xml" href="https://onepaperhoon.com/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800;900&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* onepaperhoon 종이 한 장 디자인 시스템과 같은 토큰 (src/styles/global.css) */
@font-face{{font-family:Pretendard;font-weight:500;font-display:swap;src:url(fonts/Pretendard-Medium.otf) format("opentype")}}
@font-face{{font-family:Pretendard;font-weight:800;font-display:swap;src:url(fonts/Pretendard-ExtraBold.otf) format("opentype")}}
:root{{--cream:#f8f4ec;--cream-2:#efe9dc;--ink:#1b1a2e;--ink-2:#26243f;--muted:#6d6a80;--line:rgba(27,26,46,.12);--accent:#ff5a36;--lilac:#c9c4ff;--sky-top:#3647c9;--sky-mid:#8f8cf0;--green:#6df0a8;
--sans:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;--display:"Unbounded",var(--sans);--mono:"JetBrains Mono",ui-monospace,Consolas,monospace;--gutter:clamp(20px,5vw,72px);--radius:28px;--ease:cubic-bezier(.22,1,.36,1)}}
*,*::before,*::after{{box-sizing:border-box}}html{{-webkit-text-size-adjust:100%}}
body{{margin:0;background:var(--cream);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.65;word-break:keep-all;-webkit-font-smoothing:antialiased}}
a{{color:inherit}}h1,h2,h3,p{{margin:0}}::selection{{background:var(--accent);color:#fff}}
.shell{{width:min(1200px,100% - var(--gutter)*2);margin-inline:auto}}
.site-header{{position:sticky;top:0;z-index:20;background:rgba(248,244,236,.86);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4)}}
.site-header__inner{{display:flex;align-items:center;justify-content:space-between;height:84px}}
.brand{{display:inline-flex;align-items:center;gap:10px;font-family:var(--display);font-size:.95rem;font-weight:800;letter-spacing:-.04em;text-decoration:none}}
.brand__sheet{{width:17px;height:23px;border-radius:2px;background:currentColor;clip-path:polygon(0 0,62% 0,100% 28%,100% 100%,0 100%)}}
.site-nav{{display:flex;gap:clamp(14px,2.6vw,30px);font-size:.95rem;font-weight:700}}.site-nav a{{text-decoration:none;opacity:.78}}.site-nav a:hover,.site-nav a[aria-current]{{opacity:1;text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:2px}}
.eyebrow{{font-size:.78rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase}}.eyebrow--accent{{color:var(--accent)}}
.headline{{font-size:clamp(2.2rem,5.2vw,4.5rem);font-weight:800;letter-spacing:-.045em;line-height:1.08}}
.lede{{font-size:clamp(1.05rem,1.6vw,1.35rem);line-height:1.6;color:var(--muted)}}
.page-top{{padding:clamp(60px,9vw,110px) 0 clamp(40px,6vw,70px)}}.page-top .lede{{margin-top:18px;max-width:34em}}
.section{{padding:clamp(28px,4vw,56px) 0}}
.section__head{{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 20px;margin-bottom:clamp(18px,2.6vw,30px)}}
.section__head h2{{font-size:clamp(1.5rem,3vw,2.3rem);font-weight:800;letter-spacing:-.04em;line-height:1.15}}.section__head p{{color:var(--muted);font-size:.95rem}}
.stats{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:clamp(34px,5vw,60px)}}
.stat{{padding:6px clamp(14px,3vw,40px);text-align:center}}.stat+.stat{{border-left:1.5px solid rgba(124,108,240,.4)}}
.stat__value{{display:block;font-family:var(--display);font-size:clamp(2.4rem,5.4vw,4.2rem);font-weight:800;letter-spacing:-.06em;line-height:1}}
.stat__label{{display:block;margin-top:14px;font-size:1rem;font-weight:500}}.stat__sub{{display:block;margin-top:4px;color:var(--muted);font-size:.86rem}}
.cell{{position:relative;padding:clamp(26px,3vw,36px);border-radius:var(--radius);background:var(--ink);color:#fff;overflow:hidden}}
.cell__label{{color:var(--lilac);font-size:.78rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase}}
.cell__title{{margin-top:12px;font-size:clamp(1.3rem,2.2vw,1.8rem);font-weight:400;letter-spacing:-.035em;line-height:1.26}}.cell__title strong{{font-weight:800}}
.chart{{display:block;width:100%;height:auto;margin-top:22px}}.chart rect{{fill:var(--sky-mid);opacity:.9}}.chart rect.is-today{{fill:var(--green)}}.chart__val{{font-size:12px;fill:rgba(255,255,255,.8);font-family:var(--mono)}}.chart__day{{font-size:12px;fill:rgba(255,255,255,.5);font-family:var(--mono)}}.chart line{{stroke:rgba(255,255,255,.14)}}
.facts{{width:100%;border-collapse:collapse;border-top:1.5px solid var(--ink)}}
.facts th,.facts td{{padding:16px 10px 16px 0;text-align:right;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}}
.facts th:first-child,.facts td:first-child{{text-align:left}}.facts thead th{{padding-top:18px;color:var(--muted);font-size:.78rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}}
.facts tbody th{{font-weight:800;font-size:1.05rem}}.facts tbody th a{{text-decoration:none}}.facts td b{{font-family:var(--display);font-size:1.15rem;letter-spacing:-.04em}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}}
.paper{{position:relative;padding:clamp(22px,2.6vw,32px);border-radius:6px;background:#fff;box-shadow:0 1px 0 var(--line),0 24px 50px -36px rgba(27,26,46,.45)}}
.paper::before{{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.6),transparent 40%)}}
.paper__label{{display:flex;align-items:center;gap:.6em;padding-bottom:12px;border-bottom:1px solid var(--line);font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}}
.paper__label::before{{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}}.paper__label small{{margin-left:auto;color:var(--muted);font-weight:600;letter-spacing:0;text-transform:none;font-size:.78rem}}
.paper__title{{margin-top:16px;font-size:1.25rem;font-weight:800;letter-spacing:-.04em}}
.bars{{margin:16px 0 0;padding:0;list-style:none;display:grid;gap:9px}}.bars li{{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) 68px;align-items:center;gap:10px;font-size:.92rem}}
.bars__label{{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-family:var(--mono);font-size:.84rem}}.bars__track{{height:8px;border-radius:4px;background:var(--cream-2);overflow:hidden}}.bars__track i{{display:block;height:100%;background:var(--ink);border-radius:4px}}
.bars__num{{text-align:right;font-family:var(--display);font-weight:800;font-size:.95rem;letter-spacing:-.04em}}.bars__num small{{margin-left:3px;color:var(--muted);font-family:var(--sans);font-weight:500;font-size:.78rem}}
.empty{{margin:16px 0 0;color:var(--muted);font-size:.92rem}}
.foot{{padding:clamp(40px,6vw,80px) 0;color:var(--muted);font-size:.88rem}}.foot a{{text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:4px}}
@media(max-width:860px){{.stats{{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:28px}}.stat:nth-child(3){{border-left:0}}.facts thead{{display:none}}.facts td b{{font-size:1rem}}}}
@media(max-width:560px){{.site-nav a:nth-child(n+3){{display:none}}}}
</style></head><body>
<header class="site-header"><div class="shell site-header__inner">
 <a class="brand" href="https://onepaperhoon.com/"><span class="brand__sheet" aria-hidden="true"></span><span>onepaperhoon</span></a>
 <nav class="site-nav" aria-label="주요 메뉴"><a href="https://onepaperhoon.com/#work">Work</a><a href="https://onepaperhoon.com/notes">Notes</a><a href="https://onepaperhoon.com/about">About</a><a href="#" aria-current="page">Stats</a></nav>
</div></header>
<main>
 <section class="shell page-top">
  <p class="eyebrow eyebrow--accent">Stats · 세 사이트 합산</p>
  <h1 class="headline" style="margin-top:14px">숫자는 있는 그대로.</h1>
  <p class="lede">onepaperhoon.com · rouletteside.com · psychicdollop.com 의 최근 30일. 매시간 갱신, 마지막 갱신 {now.strftime("%m월 %d일 %H:%M")}.</p>
  <div class="stats">
   <div class="stat"><span class="stat__value">{fmt(t_v)}</span><span class="stat__label">오늘 방문자</span><span class="stat__sub">페이지뷰 {fmt(t_h)}</span></div>
   <div class="stat"><span class="stat__value">{fmt(w_v)}</span><span class="stat__label">최근 7일</span><span class="stat__sub">페이지뷰 {fmt(w_h)}</span></div>
   <div class="stat"><span class="stat__value">{fmt(m_v)}</span><span class="stat__label">최근 30일</span><span class="stat__sub">페이지뷰 {fmt(m_h)}</span></div>
   <div class="stat"><span class="stat__value">{(m_v / max(1, len([k for k in days if k in cd]))):.1f}</span><span class="stat__label">하루 평균</span><span class="stat__sub">기록이 있는 날 기준</span></div>
  </div>
 </section>

 <section class="shell section">
  <article class="cell">
   <p class="cell__label">Daily</p>
   <h2 class="cell__title">최근 30일, <strong>하루하루의 방문자.</strong> <span style="opacity:.6;font-size:.8em">초록 막대가 오늘</span></h2>
   {"".join(svg)}
  </article>
 </section>

 <section class="shell section">
  <div class="section__head"><h2>사이트별.</h2><p>방문자 = 같은 날 같은 IP·브라우저를 한 명으로</p></div>
  <table class="facts"><thead><tr><th>사이트</th><th>오늘</th><th>7일</th><th>30일 방문자</th><th>30일 페이지뷰</th></tr></thead><tbody>{"".join(site_rows)}</tbody></table>
 </section>

 <section class="shell section">
  <div class="section__head"><h2>많이 본 페이지.</h2><p>최근 30일 방문자 수 기준</p></div>
  <div class="grid">{"".join(site_pages)}</div>
 </section>

 <section class="shell section">
  <div class="section__head"><h2>어디서, 무엇으로 왔나.</h2><p>직접 입력·북마크는 유입 사이트에 잡히지 않습니다</p></div>
  <div class="grid">
   <section class="paper"><p class="paper__label">Referrers</p><h3 class="paper__title">유입 사이트</h3>{bar_rows(refs, lambda r: esc(r["data"]))}</section>
   <section class="paper"><p class="paper__label">Browsers</p><h3 class="paper__title">브라우저</h3>{bar_rows(browsers, lambda r: esc(r["data"]), 6)}</section>
   <section class="paper"><p class="paper__label">Devices</p><h3 class="paper__title">기기</h3>{bar_rows(oses, lambda r: esc(os_label.get(r["data"], r["data"])), 6)}</section>
  </div>
 </section>

 <footer class="shell foot">IP는 익명화해 저장하고 30일 뒤 지웁니다. 봇·크롤러·정적 파일 요청·이 페이지 자체는 집계에서 뺐습니다. 더 자세한 원본은 <a href="detail.html">goaccess 리포트</a>.</footer>
</main>
</body></html>"""
open(OUT, "w", encoding="utf-8").write(doc)
print(f"rendered {OUT}: today {t_v}/{t_h}, 30d {m_v}/{m_h}")
