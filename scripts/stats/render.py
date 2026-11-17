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

def bar_rows(rows, label_fn, max_items=8, unit="명"):
    rows = rows[:max_items]
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
svg = [f'<svg viewBox="0 0 {W} {H + 30}" class="chart" role="img" aria-label="최근 30일 일별 방문자">']
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
    site_pages.append(f'<section class="card"><h3>{esc(domain)}<small>인기 페이지 · 30일 방문자</small></h3>{bar_rows(pages, lambda r: esc(r["data"]))}</section>')

# ---- 유입 경로 / 브라우저 / 기기
refs = [r for r in panel(combined, "referring_sites") if r["data"] not in OWN]
browsers = [r for r in panel(combined, "browsers") if r["data"] not in ("Others", "Crawlers", "Unknown")]
oses = [r for r in panel(combined, "os") if r["data"] not in ("Unknown", "Crawlers")]
os_label = {"Windows": "Windows", "macOS": "Mac", "iOS": "iPhone·iPad", "Android": "Android", "Linux": "Linux", "Chrome OS": "Chromebook"}

doc = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>방문 통계 — onepaperhoon</title>
<style>
:root{{--ink:#1b1a2e;--muted:#6b6a80;--line:#e6e4ee;--bg:#f6f5fa;--card:#fff;--accent:#3647c9;--accent2:#6df0a8}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}}
.wrap{{max-width:1040px;margin:0 auto;padding:36px 20px 80px}}
header{{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 20px}}
h1{{margin:0;font-size:1.8rem;letter-spacing:-.03em}}header p{{margin:0;color:var(--muted);font-size:.92rem}}
h2{{margin:44px 0 14px;font-size:1.15rem;letter-spacing:-.02em}}h2 small,h3 small{{margin-left:10px;color:var(--muted);font-weight:500;font-size:.82rem}}
.kpis{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:22px}}
.kpi{{padding:18px 20px;border-radius:14px;background:var(--card);box-shadow:0 1px 0 var(--line)}}
.kpi b{{display:block;font-size:2rem;letter-spacing:-.04em;line-height:1.1}}.kpi span{{color:var(--muted);font-size:.86rem}}.kpi em{{display:block;margin-top:4px;color:var(--muted);font-style:normal;font-size:.84rem}}
.card{{padding:20px 22px;border-radius:14px;background:var(--card);box-shadow:0 1px 0 var(--line)}}
.chart{{display:block;width:100%;height:auto}}.chart rect{{fill:var(--accent);opacity:.85}}.chart rect.is-today{{fill:#1fb86b}}.chart__val{{font-size:12px;fill:var(--muted)}}.chart__day{{font-size:12px;fill:var(--muted)}}
table{{width:100%;border-collapse:collapse}}th,td{{padding:10px 8px;text-align:right;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}}th:first-child,td:first-child{{text-align:left}}thead th{{color:var(--muted);font-size:.8rem;font-weight:600}}tbody th a{{color:inherit;text-decoration:none}}tbody th{{font-weight:700}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}}.card h3{{margin:0 0 12px;font-size:1rem}}
.bars{{margin:0;padding:0;list-style:none;display:grid;gap:8px}}.bars li{{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 64px;align-items:center;gap:10px;font-size:.92rem}}
.bars__label{{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}}.bars__track{{height:10px;border-radius:5px;background:var(--bg);overflow:hidden}}.bars__track i{{display:block;height:100%;background:var(--accent);border-radius:5px}}
.bars__num{{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}}.bars__num small{{margin-left:2px;color:var(--muted);font-weight:500}}
.empty{{margin:0;color:var(--muted);font-size:.92rem}}footer{{margin-top:50px;color:var(--muted);font-size:.84rem}}footer a{{color:inherit}}
@media(max-width:720px){{.kpis{{grid-template-columns:repeat(2,1fr)}}.kpi b{{font-size:1.6rem}}}}
</style></head><body><div class="wrap">
<header><h1>방문 통계</h1><p>세 사이트 합산 · 최근 30일 · 매시간 갱신 · 마지막 갱신 {now.strftime("%m월 %d일 %H:%M")}</p></header>
<div class="kpis">
 <div class="kpi"><span>오늘 방문자</span><b>{fmt(t_v)}</b><em>페이지뷰 {fmt(t_h)}</em></div>
 <div class="kpi"><span>최근 7일 방문자</span><b>{fmt(w_v)}</b><em>페이지뷰 {fmt(w_h)}</em></div>
 <div class="kpi"><span>최근 30일 방문자</span><b>{fmt(m_v)}</b><em>페이지뷰 {fmt(m_h)}</em></div>
 <div class="kpi"><span>하루 평균 방문자<br></span><b>{(m_v / max(1, len([k for k in days if k in cd]))):.1f}</b><em>기록이 있는 날 기준</em></div>
</div>
<h2>일별 방문자<small>초록 막대가 오늘</small></h2>
<div class="card">{"".join(svg)}</div>
<h2>사이트별</h2>
<div class="card"><table><thead><tr><th>사이트</th><th>오늘</th><th>7일</th><th>30일 방문자</th><th>30일 페이지뷰</th></tr></thead><tbody>{"".join(site_rows)}</tbody></table></div>
<h2>인기 페이지</h2>
<div class="grid">{"".join(site_pages)}</div>
<h2>어디서 왔나<small>직접 입력·북마크는 집계되지 않음</small></h2>
<div class="grid">
 <section class="card"><h3>유입 사이트</h3>{bar_rows(refs, lambda r: esc(r["data"]))}</section>
 <section class="card"><h3>브라우저</h3>{bar_rows(browsers, lambda r: esc(r["data"]), 6)}</section>
 <section class="card"><h3>기기</h3>{bar_rows(oses, lambda r: esc(os_label.get(r["data"], r["data"])), 6)}</section>
</div>
<footer>방문자 = 같은 날 같은 IP·브라우저를 한 명으로 셉니다(IP는 익명화). 봇·크롤러·정적 파일 요청·이 통계 페이지는 제외. 더 자세한 원본은 <a href="detail.html">goaccess 리포트</a>.</footer>
</div></body></html>"""
open(OUT, "w", encoding="utf-8").write(doc)
print(f"rendered {OUT}: today {t_v}/{t_h}, 30d {m_v}/{m_h}")
