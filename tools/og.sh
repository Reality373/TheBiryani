#!/usr/bin/env bash
# Render the link-preview image (og-image.png, 1200 x 630) from tools/og.html in headless Chrome.
# Usage: tools/og.sh
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
port=$((20000 + $$ % 20000))
profile=$(mktemp -d)
(cd "$root" && exec python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1) &
server=$!
trap 'kill $server 2>/dev/null; rm -rf "$profile"' EXIT
sleep 0.7
google-chrome --headless=new --no-first-run --disable-gpu --hide-scrollbars --user-data-dir="$profile" \
  --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot="$root/og-image.png" "http://127.0.0.1:$port/tools/og.html" >/dev/null 2>&1
echo "$root/og-image.png"
