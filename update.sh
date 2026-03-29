#!/usr/bin/env bash
set -e

bold()    { printf '\033[1m%s\033[0m' "$1"; }
green()   { printf '\033[0;32m%s\033[0m' "$1"; }
blue()    { printf '\033[0;34m%s\033[0m' "$1"; }

info()    { printf '%s %s\n' "$(blue 'ℹ')" "$1"; }
success() { printf '%s %s\n' "$(green '✓')" "$1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/mediagen"

printf '\n%s\n\n' "$(bold 'mediagen — update')"

cd "$SCRIPT_DIR"

info "Pulling latest changes..."
git pull --ff-only 2>/dev/null || git pull 2>/dev/null
success "Repository updated"

info "Installing dependencies..."
npm install --silent 2>/dev/null
success "Dependencies installed"

info "Building..."
npm run build --silent 2>/dev/null
chmod +x dist/index.js
success "Build complete"

info "Linking mediagen globally..."
npm link --silent 2>/dev/null
success "mediagen updated globally"

info "Updating Claude Code skill..."
mkdir -p "$SKILL_DIR"
cp "$SCRIPT_DIR/skills/SKILL.md" "$SKILL_DIR/SKILL.md"
success "Skill updated"

printf '\n%s\n\n' "$(bold "$(green 'Update complete!')")"
