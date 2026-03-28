#!/usr/bin/env bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/mediagen"
CONFIG_DIR="$HOME/.config/mediagen"

echo -e "\n${BOLD}mediagen — setup${NC}\n"

# --- 1. Install dependencies ---
info "Installing dependencies..."
cd "$SCRIPT_DIR"
npm install --silent 2>/dev/null
success "Dependencies installed"

# --- 2. Build ---
info "Building..."
npm run build --silent 2>/dev/null
chmod +x dist/index.js
success "Build complete"

# --- 3. Link globally ---
info "Linking mediagen globally..."
npm link --silent 2>/dev/null
success "mediagen is now available globally"

# --- 4. Install Claude Code skill ---
info "Installing Claude Code skill..."
mkdir -p "$SKILL_DIR"
cp "$SCRIPT_DIR/skills/SKILL.md" "$SKILL_DIR/SKILL.md"
success "Skill installed at $SKILL_DIR/SKILL.md"

# --- 5. Configure credentials ---
if [ -f "$CONFIG_DIR/config.json" ]; then
  EXISTING_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_DIR/config.json','utf8'));console.log(c.higgsfield?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
  if [ "$EXISTING_KEY" = "yes" ]; then
    success "Credentials already configured"
    SKIP_CREDS=true
  fi
fi

if [ "$SKIP_CREDS" != "true" ]; then
  echo ""
  info "No credentials found. Let's configure Higgsfield."
  info "Get your keys at: https://cloud.higgsfield.ai/api-keys"
  echo ""

  read -rp "  API Key: " API_KEY
  read -rp "  API Secret: " API_SECRET

  if [ -n "$API_KEY" ] && [ -n "$API_SECRET" ]; then
    mediagen config set api-key "$API_KEY" 2>/dev/null
    mediagen config set api-secret "$API_SECRET" 2>/dev/null
    success "Credentials saved to $CONFIG_DIR/config.json"
  else
    warn "Skipped. Configure later with:"
    echo "  mediagen config set api-key YOUR_KEY"
    echo "  mediagen config set api-secret YOUR_SECRET"
  fi
fi

# --- Done ---
echo ""
echo -e "${BOLD}${GREEN}Setup complete!${NC}"
echo ""
echo "  Try it out:"
echo "    mediagen --help"
echo "    mediagen models"
echo "    mediagen image generate --prompt \"test\" --no-poll"
echo ""
echo "  Claude Code will automatically use mediagen when you"
echo "  ask it to generate images or videos for your project."
echo ""
