# mediagen

CLI for AI media generation — images and videos from text prompts. Built for developers who want to generate assets directly from the terminal or let AI coding assistants (like Claude Code) produce visuals autonomously during development.

Supports multiple providers with an extensible architecture: **Gemini** (Google, free tier), **Freepik** (10+ models), and **Higgsfield** (images + video).

## Quick setup

One command does everything — installs dependencies, builds, links globally, installs the Claude Code skill, and configures credentials:

```bash
git clone git@github.com:tree-ia/media-generator-cli.git
cd media-generator-cli
./setup.sh
```

The setup script will:
1. Install dependencies (`npm install`)
2. Build the project (`tsc`)
3. Link `mediagen` globally (`npm link`)
4. Install the Claude Code skill at `~/.claude/skills/mediagen/`
5. Prompt for provider selection and API credentials (saved to `~/.config/mediagen/config.json`)

### Manual installation

If you prefer to set things up manually:

```bash
git clone git@github.com:tree-ia/media-generator-cli.git
cd media-generator-cli
npm install
npm run build
npm link

# Install Claude Code skill
mkdir -p ~/.claude/skills/mediagen
cp skills/SKILL.md ~/.claude/skills/mediagen/SKILL.md

# Configure credentials
mediagen config set provider gemini
mediagen config set api-key YOUR_GEMINI_API_KEY
```

### Verify installation

```bash
mediagen --help
mediagen models
```

## Configuration

### Providers and credentials

**Gemini** (free tier available):

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key
3. Configure:
```bash
mediagen config set provider gemini
mediagen config set api-key YOUR_KEY
```

**Freepik** (€5 free credit):

1. Go to [freepik.com/api](https://www.freepik.com/api) → Developer Dashboard
2. Generate an API key
3. Configure:
```bash
mediagen config set provider freepik
mediagen config set api-key YOUR_KEY
```

**Higgsfield** (Creator plan required):

1. Go to [cloud.higgsfield.ai/api-keys](https://cloud.higgsfield.ai/api-keys)
2. Generate a new API key pair (Key + Secret)
3. Configure:
```bash
mediagen config set provider higgsfield
mediagen config set api-key YOUR_KEY
mediagen config set api-secret YOUR_SECRET
```

### Configuration commands

```bash
mediagen config                           # show current config (credentials masked)
mediagen config show --json               # JSON output
mediagen config path                      # show config file location
mediagen config providers                 # list available providers
mediagen config set provider <name>       # change default provider
mediagen config set api-key <key>         # save API key for current provider
mediagen config set api-secret <secret>   # save API secret (Higgsfield only)
mediagen config set output-dir <path>     # change default output directory
mediagen config remove <provider>         # remove stored credentials
```

All config is stored in `~/.config/mediagen/config.json`.

## Usage

Every command and subcommand has `--help` with examples:

```bash
mediagen --help
mediagen image --help
mediagen image generate --help
mediagen video generate --help
```

### Generate an image

```bash
# Basic
mediagen image generate --prompt "modern office building at sunset"

# With size and quality
mediagen image generate \
  --prompt "hero banner for construction company" \
  --size 16:9 \
  --quality 2K \
  --output ./public/hero.png

# With specific provider and model
mediagen image generate \
  --prompt "logo design" \
  --provider gemini \
  --model gemini-pro-preview \
  --quality 2K \
  --output ./logo.png

# Non-blocking (returns request ID immediately — Freepik/Higgsfield only)
mediagen image generate --prompt "test image" --no-poll
```

### Generate a video

Video generation is currently supported by Higgsfield only.

```bash
# From local image
mediagen video generate \
  --image ./hero.png \
  --prompt "cinematic zoom out" \
  --provider higgsfield \
  --output ./hero-video.mp4

# From URL with specific model
mediagen video generate \
  --image https://example.com/photo.png \
  --prompt "slow pan right" \
  --model seedance \
  --provider higgsfield \
  --output ./pan.mp4
```

### Check generation status

```bash
mediagen status <request-id>
mediagen status <request-id> --json
```

### Browse available resources

```bash
mediagen models                          # list models for current provider
mediagen models --provider freepik       # list models for a specific provider
mediagen styles                          # list image styles
mediagen motions                         # list video motion presets
```

### Upload an image

Upload a local file to get a public URL (useful for video generation, Higgsfield only):

```bash
mediagen upload ./reference.png
```

### Manage characters

Characters provide visual consistency across multiple generations (Higgsfield only):

```bash
mediagen characters list
mediagen characters create --name "Worker" --images ./ref1.png ./ref2.png
mediagen image generate --prompt "worker on site" --character <id> --output ./scene.png
```

## Available models

### Gemini

| Model | Name | Quality | Notes |
|-------|------|---------|-------|
| `gemini-flash` | Gemini 2.5 Flash | Good | Fast, free tier available |
| `gemini-flash-preview` | Gemini 3.1 Flash Preview | High | Supports 2K/4K |
| `gemini-pro-preview` | Gemini 3 Pro Preview | Highest | Supports 2K/4K, slower |

### Freepik

| Model | Name | Notes |
|-------|------|-------|
| `mystic` | Mystic | Flagship, hyper-realistic |
| `flux-2-pro` | Flux 2 Pro | High quality, custom dimensions |
| `flux-2-klein` | Flux 2 Klein | Sub-second generation |
| `flux-kontext` | Flux Kontext Pro | Context-aware |
| `flux-pro` | Flux Pro 1.1 | Great detail |
| `flux-dev` | Flux Dev | Lighting/framing effects |
| `hyperflux` | HyperFlux | Ultra-fast |
| `seedream-4.5` | Seedream 4.5 | Creative, cinematic |
| `seedream-4` | Seedream 4 | Artistic |
| `runway` | RunWay | Pixel ratio format |

### Higgsfield

| Model | Type | Notes |
|-------|------|-------|
| `soul` | Image | Flagship text-to-image |
| `reve` | Image | Versatile |
| `seedream` | Image | ByteDance, artistic |
| `dop-preview` | Video | Fast preview quality |
| `dop-standard` | Video | Highest quality |
| `seedance` | Video | Professional-grade |
| `kling` | Video | Cinematic animations |

## Global flags

These flags work on all generation commands:

| Flag | Description |
|------|-------------|
| `--provider <name>` | Override default provider |
| `--output, -o <path>` | Save result to local file |
| `--json` | Machine-readable JSON output |
| `--no-poll` | Return request ID without waiting |
| `--help, -h` | Show help for any command |

## Aspect ratios

Use `--size` with any of these ratios:

`1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `21:9`

## Claude Code integration

`mediagen` is designed to be used by AI coding assistants via the `--help` self-documentation pattern. Claude Code can run `mediagen --help`, understand all commands, and generate assets autonomously during development.

### Setup as a Skill

Copy the included skill to your Claude Code skills directory:

```bash
# Global (available in all projects)
cp -r skills/SKILL.md ~/.claude/skills/mediagen/SKILL.md

# Per-project
mkdir -p .claude/skills/mediagen
cp skills/SKILL.md .claude/skills/mediagen/SKILL.md
```

Once installed, Claude Code will automatically use `mediagen` when you ask it to generate images or videos for your project.

### Why CLI over MCP?

| | CLI (`mediagen`) | MCP Server |
|--|------------------|------------|
| Context cost | ~350 tokens | ~50,000+ tokens |
| Setup | `npm link` | JSON config + server process |
| Self-documenting | `--help` on every command | Schema loaded upfront |
| Composability | Unix pipes, `&&`, output redirection | None |
| LLM fluency | Trained on billions of CLI interactions | Zero training data on MCP schemas |

## Architecture

```
src/
├── index.ts                    # Entry point, commander setup
├── config.ts                   # Configuration (~/.config/mediagen/config.json)
├── commands/                   # One file per command group
│   ├── image.ts                #   mediagen image generate
│   ├── video.ts                #   mediagen video generate
│   ├── status.ts               #   mediagen status <id>
│   ├── models.ts               #   mediagen models
│   ├── styles.ts               #   mediagen styles
│   ├── motions.ts              #   mediagen motions
│   ├── upload.ts               #   mediagen upload <file>
│   ├── characters.ts           #   mediagen characters list|create
│   └── config.ts               #   mediagen config show|set|remove|providers
├── providers/
│   ├── types.ts                # Provider interface (contract)
│   ├── registry.ts             # Provider factory
│   ├── gemini/                 # Google Gemini (direct API)
│   │   ├── index.ts
│   │   ├── client.ts
│   │   └── models.ts
│   ├── freepik/                # Freepik API
│   │   ├── index.ts
│   │   ├── client.ts
│   │   └── models.ts
│   └── higgsfield/             # Higgsfield API
│       ├── index.ts
│       ├── client.ts
│       └── models.ts
└── utils/
    ├── output.ts               # Formatting (table, colors, JSON)
    └── download.ts             # Download results to local files
```

### Adding a new provider

1. Create `src/providers/<name>/index.ts` implementing the `Provider` interface
2. Register it in `src/providers/registry.ts`
3. No changes needed in commands — they work through the provider abstraction

## Updating

After pulling new changes:

```bash
./update.sh
```

This rebuilds, relinks globally, and updates the Claude Code skill.

## Development

```bash
# Run without building (uses tsx)
npm run dev -- image generate --prompt "test"

# Build
npm run build

# Type-check only
npx tsc --noEmit
```

## License

MIT
