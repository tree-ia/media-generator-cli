#!/usr/bin/env bash
set -e

# --- Colors (using printf for portability) ---
bold()    { printf '\033[1m%s\033[0m' "$1"; }
green()   { printf '\033[0;32m%s\033[0m' "$1"; }
blue()    { printf '\033[0;34m%s\033[0m' "$1"; }
yellow()  { printf '\033[0;33m%s\033[0m' "$1"; }
dim()     { printf '\033[2m%s\033[0m' "$1"; }

info()    { printf '%s %s\n' "$(blue 'ℹ')" "$1"; }
success() { printf '%s %s\n' "$(green '✓')" "$1"; }
warn()    { printf '%s %s\n' "$(yellow '⚠')" "$1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/mediagen"
CONFIG_DIR="$HOME/.config/mediagen"
CONFIG_FILE="$CONFIG_DIR/config.json"

# --- Arrow key menu selector ---
select_option() {
  local options=("$@")
  local selected=0
  local count=${#options[@]}

  # Hide cursor
  printf '\033[?25l'

  # Draw menu
  draw_menu() {
    for i in "${!options[@]}"; do
      # Move to correct line and clear it
      printf '\r\033[K'
      if [ "$i" -eq "$selected" ]; then
        printf '  \033[1;32m❯ %s\033[0m\n' "${options[$i]}"
      else
        printf '    %s\n' "${options[$i]}"
      fi
    done
  }

  draw_menu

  while true; do
    # Read single keypress
    IFS= read -rsn1 key

    # Handle arrow keys (escape sequences)
    if [ "$key" = $'\033' ]; then
      read -rsn2 seq
      case "$seq" in
        '[A') # Up
          if [ "$selected" -gt 0 ]; then
            selected=$((selected - 1))
          fi
          ;;
        '[B') # Down
          if [ "$selected" -lt $((count - 1)) ]; then
            selected=$((selected + 1))
          fi
          ;;
      esac
    elif [ "$key" = '' ]; then
      # Enter pressed
      break
    fi

    # Redraw: move cursor up N lines
    printf '\033[%dA' "$count"
    draw_menu
  done

  # Show cursor
  printf '\033[?25h'

  return "$selected"
}

printf '\n%s\n\n' "$(bold 'mediagen — setup')"

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

# --- Helper: configure provider credentials ---
setup_provider() {
  local name="$1"
  local config_key="$2"
  local url="$3"
  local needs_secret="$4"

  HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.${config_key}?.apiKey||c.${config_key}?.accessKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
  if [ "$HAS_KEY" = "yes" ]; then
    success "$name credentials already configured"
    return
  fi

  printf '\n'
  info "Enter your $name credentials"
  printf '  Get them at: %s\n\n' "$(dim "$url")"
  read -rp "  API Key: " API_KEY

  if [ -z "$API_KEY" ]; then
    warn "Skipped. Run later: mediagen config set api-key YOUR_KEY --provider $name"
    return
  fi

  mediagen config set api-key "$API_KEY" --provider "$name" 2>/dev/null

  if [ "$needs_secret" = "yes" ]; then
    read -rp "  API Secret: " API_SECRET
    if [ -n "$API_SECRET" ]; then
      mediagen config set api-secret "$API_SECRET" --provider "$name" 2>/dev/null
    fi
  fi

  success "$name credentials saved"
}

# --- 5. Choose image provider ---
printf '\n%s\n\n' "$(bold 'Choose your default image provider:')"

IMAGE_PROVIDERS=(
  "Gemini      Free tier, Google Gemini 2.5 Flash/3.1/Pro"
  "Freepik     10+ models (Mystic, Flux, Seedream), €5 free credit"
  "Runway      Gen-4 Image/Turbo, high quality"
  "Kling       Kling Image v2/v2.1"
  "Higgsfield  Soul, Reve, Seedream v4"
  "Skip        Configure later"
)

select_option "${IMAGE_PROVIDERS[@]}"
IMG_CHOICE=$?

IMG_PROVIDERS_MAP=(gemini freepik runway kling higgsfield)

if [ "$IMG_CHOICE" -lt 5 ]; then
  SELECTED_IMG="${IMG_PROVIDERS_MAP[$IMG_CHOICE]}"
  mediagen config set image-provider "$SELECTED_IMG" 2>/dev/null
  success "Image provider set to: $SELECTED_IMG"

  case "$IMG_CHOICE" in
    0) setup_provider "gemini" "gemini" "https://aistudio.google.com/apikey" "no" ;;
    1) setup_provider "freepik" "freepik" "https://www.freepik.com/api" "no" ;;
    2) setup_provider "runway" "runway" "https://dev.runwayml.com/" "no" ;;
    3) setup_provider "kling" "kling" "https://app.klingai.com/global/dev" "yes" ;;
    4) setup_provider "higgsfield" "higgsfield" "https://cloud.higgsfield.ai/api-keys" "yes" ;;
  esac
else
  warn "Skipped. Run later: mediagen config set image-provider <name>"
fi

# --- 6. Choose video provider ---
printf '\n%s\n\n' "$(bold 'Choose your default video provider:')"

VIDEO_PROVIDERS=(
  "Runway      Gen-4 Turbo (\$0.05/s), Gen-4.5 (text-to-video)"
  "Kling       Kling v2/v2.1/v2.5 Turbo, text-to-video"
  "Higgsfield  DoP, Seedance, Kling 2.1 Pro"
  "Skip        Configure later"
)

select_option "${VIDEO_PROVIDERS[@]}"
VID_CHOICE=$?

VID_PROVIDERS_MAP=(runway kling higgsfield)

if [ "$VID_CHOICE" -lt 3 ]; then
  SELECTED_VID="${VID_PROVIDERS_MAP[$VID_CHOICE]}"
  mediagen config set video-provider "$SELECTED_VID" 2>/dev/null
  success "Video provider set to: $SELECTED_VID"

  case "$VID_CHOICE" in
    0) setup_provider "runway" "runway" "https://dev.runwayml.com/" "no" ;;
    1) setup_provider "kling" "kling" "https://app.klingai.com/global/dev" "yes" ;;
    2) setup_provider "higgsfield" "higgsfield" "https://cloud.higgsfield.ai/api-keys" "yes" ;;
  esac
else
  warn "Skipped. Run later: mediagen config set video-provider <name>"
fi

# --- Done ---
printf '\n%s\n\n' "$(bold "$(green 'Setup complete!')")"
printf '  Quick start:\n'
printf '    mediagen --help              Show all commands\n'
printf '    mediagen models              List available models\n'
printf '    mediagen config              Show current config\n'
printf '\n'
printf '  Generate an image:\n'
printf '    mediagen image generate --prompt "a sunset over the ocean" --output ./sunset.png\n'
printf '\n'
printf '  Generate a video:\n'
printf '    mediagen video generate --prompt "cinematic zoom" --output ./video.mp4\n'
printf '\n'
printf '  Change defaults:\n'
printf '    mediagen config set image-provider gemini\n'
printf '    mediagen config set video-provider runway\n'
printf '\n'
printf '  Add more providers:\n'
printf '    mediagen config set api-key YOUR_KEY --provider runway\n'
printf '\n'
printf '  Claude Code will automatically use mediagen when you\n'
printf '  ask it to generate images or videos for your project.\n\n'
