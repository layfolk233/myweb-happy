#!/bin/bash
# push.sh — 替代 tests/push.bat 的 bash 版本
# 用法: ./push.sh [commit message]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

MSG="${1:-chore: auto commit}"

git add -A
git commit -m "$MSG"
git push origin main
