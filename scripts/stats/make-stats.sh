#!/usr/bin/env bash
# Caddy JSON 접근 로그(정적 사이트 셋) → goaccess JSON → 한국어 한 장 대시보드. 매시간 cron.
# 결과: /srv/sites/_stats/index.html (요약), detail.html (goaccess 원본 리포트). onepaperhoon.com/_stats/ 에서 basic auth 로 열람.
set -euo pipefail
LOGS=/var/lib/docker/volumes/knowmesh_caddy-logs/_data
OUT=/srv/sites/_stats
WORK=/opt/stats/work
DOMAINS=(onepaperhoon.com rouletteside.com psychicdollop.com)
mkdir -p "$OUT" "$WORK"
export LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8
COMMON=(--log-format=CADDY --date-format=CADDY --time-format=CADDY --anonymize-ip --no-query-string --real-os --double-decode --ignore-crawlers
  --ignore-status=301 --ignore-status=304 --ignore-status=401 --ignore-status=404
  --static-file=.js --static-file=.css --static-file=.png --static-file=.jpg --static-file=.svg --static-file=.woff2 --static-file=.otf --static-file=.glb --static-file=.ico --static-file=.xml --static-file=.webmanifest --static-file=.map --static-file=.json --static-file=.txt)
# 봇·헬스체크·curl·이 통계 페이지 자체는 뺀다.
# 취약점 스캐너 경로(/wp-*, .php, .env, 점으로 시작하는 경로…)는 Caddy 가 404 로 끊지만, 그 이전 로그도 집계에서 뺀다.
PROBE='"uri":"(/[^"]*/)?\.[^"/]+|"uri":"[^"]*\.(php|asp|aspx|jsp|cgi|sql|bak|old|env|ini|log)(\?|")|"uri":"/(wp-|wordpress|cgi-bin|vendor/|phpmyadmin|xmlrpc|admin/|administrator|owa/|autodiscover|actuator|console|telescope|solr|_ignition|boaform|HNAP1|GponForm)'
filter() { grep -v -E '"uri":"/_stats' | grep -v -E "$PROBE" | grep -v -E '"user_agent":\["[^"]*(bot|Bot|crawl|spider|curl|Go-http|python-requests|HeadlessChrome|Lighthouse|zgrab|masscan|nmap|Nuclei|censys|Expanse|Palo Alto)[^"]*"\]' || true; }
args=()
for d in "${DOMAINS[@]}"; do
  if ls "$LOGS/$d.log"* >/dev/null 2>&1 && [ -s "$LOGS/$d.log" ]; then
    cat "$LOGS/$d.log"* | filter | goaccess - "${COMMON[@]}" -o "$WORK/$d.json" >/dev/null 2>&1 || true
  fi
  args+=("$d=$WORK/$d.json")
done
all=$(for d in "${DOMAINS[@]}"; do ls "$LOGS/$d.log"* 2>/dev/null; done)
[ -n "$all" ] || exit 0
cat $all | filter | goaccess - "${COMMON[@]}" --enable-panel=VIRTUAL_HOSTS -o "$WORK/all.json" >/dev/null 2>&1
cat $all | filter | goaccess - "${COMMON[@]}" --enable-panel=VIRTUAL_HOSTS --html-report-title="onepaperhoon 방문 통계 (원본)" --html-prefs='{"theme":"bright","perPage":15}' -o "$OUT/detail.html" >/dev/null 2>&1 || true
python3 /opt/stats/render.py "$OUT/index.tmp.html" "$WORK/all.json" "${args[@]}" && mv "$OUT/index.tmp.html" "$OUT/index.html"
