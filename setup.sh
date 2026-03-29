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

# --- 5. Choose provider ---
printf '\n%s\n\n' "$(bold 'Choose your provider:')"

PROVIDERS=(
  "Gemini      Google Gemini direct API, free tier, 2.5 Flash/3.1/Pro"
  "Freepik     10+ image models, €5 free credit, pay-as-you-go"
  "Higgsfield  Soul, DoP video, Kling, Seedance (Creator plan)"
  "Skip        Configure later"
)

select_option "${PROVIDERS[@]}"
CHOICE=$?

case "$CHOICE" in
  0) # Gemini
    mediagen config set provider gemini 2>/dev/null

    HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.gemini?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$HAS_KEY" = "yes" ]; then
      success "Gemini credentials already configured"
    else
      printf '\n'
      info "Enter your Google Gemini API key"
      printf '  Get one at: %s\n\n' "$(dim 'https://aistudio.google.com/apikey')"
      read -rp "  API Key: " GEMINI_KEY

      if [ -n "$GEMINI_KEY" ]; then
        mediagen config set api-key "$GEMINI_KEY" 2>/dev/null
        success "Gemini API key saved"
      else
        warn "Skipped. Run later: mediagen config set api-key YOUR_KEY"
      fi
    fi
    ;;

  1) # Freepik
    mediagen config set provider freepik 2>/dev/null

    HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.freepik?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$HAS_KEY" = "yes" ]; then
      success "Freepik credentials already configured"
    else
      printf '\n'
      info "Enter your Freepik API key"
      printf '  Get one at: %s\n\n' "$(dim 'https://www.freepik.com/api → Developer Dashboard')"
      read -rp "  API Key: " FP_KEY

      if [ -n "$FP_KEY" ]; then
        mediagen config set api-key "$FP_KEY" 2>/dev/null
        success "Freepik API key saved"
      else
        warn "Skipped. Run later: mediagen config set api-key YOUR_KEY"
      fi
    fi
    ;;

  2) # Higgsfield
    mediagen config set provider higgsfield 2>/dev/null

    HAS_KEY=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c.higgsfield?.apiKey?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$HAS_KEY" = "yes" ]; then
      success "Higgsfield credentials already configured"
    else
      printf '\n'
      info "Enter your Higgsfield credentials (Creator plan required)"
      printf '  Get them at: %s\n\n' "$(dim 'https://cloud.higgsfield.ai/api-keys')"
      read -rp "  API Key: " HF_KEY
      read -rp "  API Secret: " HF_SECRET

      if [ -n "$HF_KEY" ] && [ -n "$HF_SECRET" ]; then
        mediagen config set api-key "$HF_KEY" 2>/dev/null
        mediagen config set api-secret "$HF_SECRET" 2>/dev/null
        success "Higgsfield credentials saved"
      else
        warn "Skipped. Run later:"
        printf '    mediagen config set api-key YOUR_KEY\n'
        printf '    mediagen config set api-secret YOUR_SECRET\n'
      fi
    fi
    ;;

  3) # Skip
    warn "Skipped provider setup. Run later:"
    printf '    mediagen config set provider gemini\n'
    printf '    mediagen config set api-key YOUR_KEY\n'
    ;;
esac

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
printf '  Switch provider anytime:\n'
printf '    mediagen config set provider gemini\n'
printf '    mediagen config set provider freepik\n'
printf '    mediagen config set provider higgsfield\n'
printf '\n'
printf '  Remove credentials:\n'
printf '    mediagen config remove freepik\n'
printf '\n'
printf '  Claude Code will automatically use mediagen when you\n'
printf '  ask it to generate images or videos for your project.\n\n'
