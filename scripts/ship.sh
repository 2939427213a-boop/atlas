#!/usr/bin/env bash
# bun run check: talk-page structure, home-page links, types, tests. No side effects.
# bun run ship:  check, deploy the committed tree, move the git tag `live` to it, then smoke-test the live site.
#                What the next deploy adds: git log --oneline live..HEAD
# scripts/ship.sh smoke: only the live checks.
# Deploying is an outward action: agents ask the user before running ship.
set -euo pipefail
cd "$(dirname "$0")/.."
SITE=https://atlas.haoli-agi.com
WRANGLER=./node_modules/.bin/wrangler

check() {
  for dir in public/talks/*/; do
    slug=$(basename "$dir")
    slides="sources/talks/$slug/slides.json"
    for page in "${dir}index.html" "${dir}zh.html"; do
      printf '%s: ' "$page"
      if [ -f "$slides" ]; then python3 -I scripts/check_page.py "$page" "$slides"
      else python3 -I scripts/check_page.py "$page"; fi
    done
    grep -q "href=\"/talks/$slug/\"" public/index.html || { echo "public/index.html has no link to /talks/$slug/"; return 1; }
  done
  bun run typecheck
  bun run test
}

# The edge serves the previous version for up to ~30 s after a deploy, so each check retries for 60 s.
expect_code() { # expect_code <code> <path> [POST]
  local want=$1 path=$2 got=
  for _ in $(seq 12); do
    if [ "${3:-}" = POST ]; then got=$(curl -s -o /dev/null -w '%{http_code}' -X POST -d x "$SITE$path")
    else got=$(curl -s -o /dev/null -w '%{http_code}' "$SITE$path"); fi
    if [ "$got" = "$want" ]; then echo "ok   $want $path"; return 0; fi
    sleep 5
  done
  echo "FAIL $path: want $want, got $got"; return 1
}
expect_same() { # expect_same <path under public/>
  for _ in $(seq 12); do
    if curl -s "$SITE/$1" | cmp -s - "public/$1"; then echo "ok   same as local /$1"; return 0; fi
    sleep 5
  done
  echo "FAIL /$1 differs from public/$1"; return 1
}

smoke() {
  local fail=0
  expect_same robots.txt || fail=1
  expect_same assets/atlas.js || fail=1
  for p in / /privacy; do expect_code 200 "$p" || fail=1; done
  for dir in public/talks/*/; do
    slug=$(basename "$dir")
    expect_code 200 "/talks/$slug/" || fail=1
    expect_code 200 "/talks/$slug/zh" || fail=1
  done
  expect_code 404 /ship-check-missing || fail=1
  expect_code 302 /admin || fail=1
  expect_code 400 /api/e POST || fail=1
  if [ "$fail" = 1 ]; then echo "Live checks failed."; return 1; fi
}

case "${1:-}" in
  check) check ;;
  smoke) smoke ;;
  ship)
    if [ -n "$(git status --porcelain)" ]; then
      echo "Uncommitted changes. Commit first so the live site matches a commit:"; git status --short; exit 1
    fi
    check
    echo "Deploying $(git log --oneline -1)"
    prev=$(git rev-parse --short live 2>/dev/null || true)
    "$WRANGLER" deploy
    git tag -f live >/dev/null && echo "git tag live -> $(git rev-parse --short HEAD)"
    smoke || { echo "To roll back: $WRANGLER rollback${prev:+ && git tag -f live $prev}"; exit 1; } ;;
  *) echo "usage: scripts/ship.sh check|ship|smoke"; exit 2 ;;
esac
