#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>
#
# Captures full-page screenshots of all dashboard views using headless Chrome.
# Usage: ./scripts/capture-screenshots.sh
# Output: docs/screenshots/*.png

set -e

# Configuration
PORT=8080
BASE_URL="http://localhost:$PORT"
OUTPUT_DIR="docs/screenshots"
WINDOW_SIZE="1400,900"

# Detect Chrome/Chromium
if command -v google-chrome &> /dev/null; then
    CHROME="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME="chromium-browser"
else
    echo "❌ Error: Chrome or Chromium not found. Please install one of:"
    echo "   sudo apt install chromium"
    echo "   sudo apt install google-chrome-stable"
    exit 1
fi

echo "📷 Using: $CHROME"

# Create output directory and temp user data dir for Chrome
mkdir -p "$OUTPUT_DIR"
CHROME_USER_DATA=$(mktemp -d /tmp/chrome-screenshot-XXXXXX)

# Start local server in background
echo "🚀 Starting local server on port $PORT..."
python3 -m http.server $PORT &> /dev/null &
SERVER_PID=$!

# Wait for server to be ready
sleep 2

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
    rm -rf "$CHROME_USER_DATA" 2>/dev/null || true
}
trap cleanup EXIT

# Define views to capture
declare -A VIEWS=(
    ["overview"]="#/overview"
    ["machine-detail"]="#/machine/1"
    ["runbooks"]="#/runbooks"
    ["commissioning"]="#/commissioning"
    ["help"]="#/help"
)

# Capture each view
echo "📸 Capturing screenshots..."
for name in "${!VIEWS[@]}"; do
    route="${VIEWS[$name]}"
    output="$OUTPUT_DIR/$name.png"
    url="$BASE_URL/$route"
    
    echo "   → $name ($url)"
    
    # Use virtual-time-budget to allow animations to complete
    # Overview needs extra time for Chart.js pie chart animation (~1500ms)
    if [[ "$name" == "overview" ]]; then
        TIME_BUDGET=3000
    else
        TIME_BUDGET=1500
    fi
    
    $CHROME \
        --headless \
        --no-sandbox \
        --user-data-dir="$CHROME_USER_DATA" \
        --screenshot="$output" \
        --window-size="$WINDOW_SIZE" \
        --hide-scrollbars \
        --virtual-time-budget="$TIME_BUDGET" \
        "$url" 2>/dev/null
done

echo ""
echo "✅ Screenshots saved to $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR"
