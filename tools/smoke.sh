#!/usr/bin/env bash
# Run the whole piece unattended in headless Chrome.
# Usage: tools/smoke.sh ['?query']
# The page is loaded with auto=1, which makes every button press itself. Passes when <html>
# ends up with data-done="1" and no data-error. Last line is "smoke: ok" or "smoke: FAILED (...)".
set -euo pipefail
query=${1:-}
root=$(cd "$(dirname "$0")/.." && pwd)
port=$((20000 + $$ % 20000))
profile=$(mktemp -d)
(cd "$root" && exec python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1) &
server=$!
trap 'kill $server 2>/dev/null; rm -rf "$profile"' EXIT
sleep 0.7
if [ -n "$query" ]; then url="http://127.0.0.1:$port/$query&auto=1"; else url="http://127.0.0.1:$port/?auto=1"; fi
dom=$(google-chrome --headless=new --no-first-run --disable-gpu --user-data-dir="$profile" \
  --window-size=500,900 --virtual-time-budget=300000 --dump-dom "$url" 2>/dev/null)
html=$(grep -o '<html[^>]*>' <<<"$dom" | head -1)
echo "$html"
if grep -q 'data-error' <<<"$html"; then echo "smoke: FAILED (uncaught error)"; exit 1; fi
if ! grep -q 'data-done="1"' <<<"$html"; then echo "smoke: FAILED (did not reach the end)"; exit 1; fi
echo "smoke: ok"
