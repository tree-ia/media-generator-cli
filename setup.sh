#!/usr/bin/env bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/mediagen"
CONFIG_DIR="$HOME/.config/mediagen"
CONFIG_FILE="$CONFIG_DIR/config.json"

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

# --- 5. Choose provider and configure credentials ---
echo ""
echo -e "${BOLD}Provider Setup${NC}"
echo ""
echo "  Available providers:"
echo ""
echo "    1) ${BOLD}freepik${NC}    — 10+ image models, €5 free credit, pay-as-you-go"
echo "                      Get key: ${DIM}https://www.freepik.com/api${NC}"
echo ""
echo "    2) ${BOLD}higgsfield${NC} — Soul, DoP video, Kling, Seedance"
echo "                      Get keys: ${DIM}https://cloud.higgsfield.ai/api-keys${NC}"
echo ""
echo "    s) ${BOLD}skip${NC}       — Configure later with: mediagen config set ..."
echo ""

read -rp "  Choose provider [1/2/s]: " CHOICE

case "$CHOICE" in
  1|freepik)
    mediagen config set provider freepik 2>/dev/null

    # Check if already configured
    HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.freepik?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$HAS_KEY" = "yes" ]; then
      success "Freepik credentials already configured"
    else
      echo ""
      info "Enter your Freepik API key"
      info "Get one at: https://www.freepik.com/api → Developer Dashboard"
      echo ""
      read -rp "  API Key: " FP_KEY

      if [ -n "$FP_KEY" ]; then
        mediagen config set api-key "$FP_KEY" 2>/dev/null
        success "Freepik API key saved"
      else
        warn "Skipped. Configure later: mediagen config set api-key YOUR_KEY"
      fi
    fi
    ;;

  2|higgsfield)
    mediagen config set provider higgsfield 2>/dev/null

    HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.higgsfield?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$HAS_KEY" = "yes" ]; then
      success "Higgsfield credentials already configured"
    else
      echo ""
      info "Enter your Higgsfield credentials (Creator plan required)"
      info "Get them at: https://cloud.higgsfield.ai/api-keys"
      echo ""
      read -rp "  API Key: " HF_KEY
      read -rp "  API Secret: " HF_SECRET

      if [ -n "$HF_KEY" ] && [ -n "$HF_SECRET" ]; then
        mediagen config set api-key "$HF_KEY" 2>/dev/null
        mediagen config set api-secret "$HF_SECRET" 2>/dev/null
        success "Higgsfield credentials saved"
      else
        warn "Skipped. Configure later:"
        echo "    mediagen config set api-key YOUR_KEY"
        echo "    mediagen config set api-secret YOUR_SECRET"
      fi
    fi
    ;;

  s|skip|"")
    warn "Skipped provider setup. Configure later:"
    echo "    mediagen config set provider freepik"
    echo "    mediagen config set api-key YOUR_KEY"
    ;;

  *)
    warn "Invalid choice. Skipping provider setup."
    ;;
esac

# --- Done ---
echo ""
echo -e "${BOLD}${GREEN}Setup complete!${NC}"
echo ""
echo "  Quick start:"
echo "    mediagen --help              Show all commands"
echo "    mediagen models              List available models"
echo "    mediagen config              Show current config"
echo "    mediagen config providers    List providers"
echo ""
echo "  Generate an image:"
echo "    mediagen image generate --prompt \"a sunset over the ocean\" --output ./sunset.png"
echo ""
echo "  Switch provider anytime:"
echo "    mediagen config set provider freepik"
echo "    mediagen config set provider higgsfield"
echo ""
echo "  Remove credentials:"
echo "    mediagen config remove freepik"
echo ""
echo "  Claude Code will automatically use mediagen when you"
echo "  ask it to generate images or videos for your project."
echo ""
