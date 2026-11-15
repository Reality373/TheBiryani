#!/usr/bin/env bash
# Screenshot the page at an exact viewport size in headless Chrome.
# Usage: tools/shot.sh OUT.png ['?query'] [W] [H] [WAIT_MS]
# Defaults: 390 x 844, 2500 ms of page time before the shot.
set -euo pipefail
[ $# -ge 1 ] || { echo "usage: tools/shot.sh OUT.png ['?query'] [W] [H] [WAIT_MS]" >&2; exit 2; }
out=$1; query=${2:-}; w=${3:-390}; h=${4:-844}; wait=${5:-2500}
root=$(cd "$(dirname "$0")/.." && pwd)
port=$((20000 + $$ % 20000))
profile=$(mktemp -d)
(cd "$root" && exec python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1) &
server=$!
trap 'kill $server 2>/dev/null; rm -rf "$profile"' EXIT
sleep 0.7
target=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "/$query")
google-chrome --headless=new --no-first-run --disable-gpu --hide-scrollbars --user-data-dir="$profile" \
  --window-size="$(( w > 500 ? w : 500 )),$(( h + 100 ))" --virtual-time-budget="$wait" \
  --screenshot="$out" "http://127.0.0.1:$port/tools/frame.html?w=$w&h=$h&u=$target" >/dev/null 2>&1
echo "$out"
