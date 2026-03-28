# mediagen

CLI for AI media generation — images and videos from text prompts. Built for developers who want to generate assets directly from the terminal or let AI coding assistants (like Claude Code) produce visuals autonomously during development.

Supports multiple providers with an extensible architecture. Currently ships with **Higgsfield** (Soul for images, DoP for videos).

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
5. Prompt for Higgsfield API credentials (saved to `~/.config/mediagen/config.json`)

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
mediagen config set api-key YOUR_KEY
mediagen config set api-secret YOUR_SECRET
```

### Verify installation

```bash
mediagen --help
mediagen models
```

## Configuration

### 1. Get API credentials

**Higgsfield** (requires Creator plan or higher):

1. Go to [cloud.higgsfield.ai/api-keys](https://cloud.higgsfield.ai/api-keys)
2. Generate a new API key pair (Key + Secret)
3. Copy both immediately — the secret is shown only once

### 2. Save credentials

The recommended way — credentials are stored in `~/.config/mediagen/config.json`:

```bash
mediagen config set api-key YOUR_API_KEY
mediagen config set api-secret YOUR_API_SECRET
```

#### Alternative: environment variables

Environment variables take priority over saved config. Use this for CI/CD or temporary overrides:

```bash
export HF_API_KEY="your-api-key"
export HF_API_SECRET="your-api-secret"
```

Or create a `.env` file in the directory where you run `mediagen`:

```bash
# .env
HF_API_KEY=your-api-key
HF_API_SECRET=your-api-secret
```

### 3. Verify configuration

```bash
mediagen config            # show current config (credentials are masked)
mediagen config show --json # JSON output
mediagen config path        # show config file location
mediagen config providers   # list available providers
```

### Configuration commands

```bash
mediagen config set api-key <key>          # save API key
mediagen config set api-secret <secret>    # save API secret
mediagen config set provider <name>        # change default provider
mediagen config set output-dir <path>      # change default output directory
```

### Priority order

Config values are resolved in this order (first wins):

1. **Environment variables** (`HF_API_KEY`, `HF_API_SECRET`, `MEDIAGEN_PROVIDER`)
2. **Saved config** (`~/.config/mediagen/config.json`)
3. **Defaults** (provider: `higgsfield`, output: `./output`)

## Usage

Every command and subcommand has `--help` with examples:

```bash
mediagen --help
mediagen image --help
mediagen image generate --help
mediagen video generate --help
mediagen characters --help
```

### Generate an image

```bash
# Basic
mediagen image generate --prompt "modern office building at sunset"

# Full options
mediagen image generate \
  --prompt "hero banner for construction company" \
  --size 2048x1152 \
  --quality 1080p \
  --output ./public/hero.png

# With style
mediagen image generate \
  --prompt "landscape painting" \
  --style <style-id> \
  --style-strength 0.8 \
  --output ./artwork.png

# With character consistency
mediagen image generate \
  --prompt "worker inspecting site" \
  --character <character-id> \
  --output ./worker-scene.png

# Non-blocking (returns request ID immediately)
mediagen image generate --prompt "test image" --no-poll
```

### Generate a video

```bash
# From local image
mediagen video generate \
  --image ./hero.png \
  --prompt "cinematic zoom out" \
  --output ./hero-video.mp4

# From URL with specific model
mediagen video generate \
  --image https://example.com/photo.png \
  --prompt "slow pan right" \
  --model dop-turbo \
  --output ./pan.mp4

# With motion preset
mediagen video generate \
  --image ./scene.png \
  --prompt "dramatic reveal" \
  --motion <motion-id> \
  --motion-strength 0.7 \
  --output ./reveal.mp4
```

### Check generation status

```bash
mediagen status <request-id>
mediagen status <request-id> --json
```

### Browse available resources

```bash
# Models
mediagen models

# Image styles (for --style flag)
mediagen styles

# Video motion presets (for --motion flag)
mediagen motions
```

### Upload an image

Upload a local file to get a public URL (useful for video generation):

```bash
mediagen upload ./reference.png
```

### Manage characters

Characters provide visual consistency across multiple generations:

```bash
# List existing characters
mediagen characters list

# Create from reference images
mediagen characters create --name "Worker" --images ./ref1.png ./ref2.png

# Use in generation
mediagen image generate --prompt "worker on site" --character <id> --output ./scene.png
```

### Configuration

```bash
# Show current config
mediagen config
mediagen config show --json

# List available providers
mediagen config providers
```

## Global flags

These flags work on all generation commands:

| Flag | Description |
|------|-------------|
| `--provider <name>` | Override default provider |
| `--output, -o <path>` | Save result to local file |
| `--json` | Machine-readable JSON output |
| `--no-poll` | Return request ID without waiting |
| `--help, -h` | Show help for any command |

## Available image sizes

| Size | Aspect |
|------|--------|
| `2048x1152` | 16:9 landscape |
| `2048x1536` | 4:3 landscape |
| `1536x1536` | 1:1 square (default) |
| `1152x2048` | 9:16 portrait |
| `1536x2048` | 3:4 portrait |
| `2016x1344`, `1696x960`, `1632x1088`, `1536x1152`, `1152x1536`, `1344x2016`, `960x1696`, `1088x1632` | Other ratios |

## Video models

| Model | Speed | Quality | Queue |
|-------|-------|---------|-------|
| `dop-lite` | Fast | Basic | Standard |
| `dop-turbo` | 2x | Good | Priority |
| `dop-standard` | Normal | Best | Priority |

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

Once installed, Claude Code will automatically use `mediagen` when you ask it to generate images or videos for your project. Example prompts:

- "Generate a hero image for the landing page"
- "Create an OG image for the blog post"
- "Make a 5-second video from this screenshot"

### How it works

1. Claude reads the skill description and knows `mediagen` is available
2. When you ask for a visual asset, Claude runs `mediagen image generate --help` to discover flags
3. Claude crafts the appropriate command with your prompt and saves the result
4. Total context cost: ~350 tokens (vs ~50,000+ for an equivalent MCP server)

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
├── config.ts                   # Environment and configuration
├── commands/                   # One file per command group
│   ├── image.ts                #   mediagen image generate
│   ├── video.ts                #   mediagen video generate
│   ├── status.ts               #   mediagen status <id>
│   ├── models.ts               #   mediagen models
│   ├── styles.ts               #   mediagen styles
│   ├── motions.ts              #   mediagen motions
│   ├── upload.ts               #   mediagen upload <file>
│   ├── characters.ts           #   mediagen characters list|create
│   └── config.ts               #   mediagen config show|providers
├── providers/
│   ├── types.ts                # Provider interface (contract)
│   ├── registry.ts             # Provider factory
│   └── higgsfield/
│       ├── index.ts            # HiggsFieldProvider implementation
│       ├── client.ts           # @higgsfield/client SDK wrapper
│       └── models.ts           # Available models and defaults
└── utils/
    ├── output.ts               # Formatting (table, colors, JSON)
    └── download.ts             # Download results to local files
```

### Adding a new provider

1. Create `src/providers/<name>/index.ts` implementing the `Provider` interface
2. Register it in `src/providers/registry.ts`
3. No changes needed in commands — they work through the provider abstraction

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
