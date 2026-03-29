---
name: mediagen
description: Generate AI images and videos for web development using the mediagen CLI. Use when the user asks to generate, create, or produce images, videos, banners, hero images, icons, or any visual asset for a project.
allowed-tools: Bash, Read, Write
---

## mediagen CLI

CLI for AI media generation. Supports multiple providers (Gemini, Freepik, Higgsfield).

Run `mediagen --help` to see all commands. Each subcommand has detailed `--help`.

### Image generation

```bash
mediagen image generate --prompt "description" --output ./path/to/file.png
mediagen image generate --prompt "description" --size 16:9 --quality 2k --output ./public/hero.png
mediagen image generate --prompt "description" --provider gemini --model gemini-flash --output ./out.png
mediagen image generate --prompt "description" --provider freepik --model flux-2-pro --output ./out.png
mediagen image generate --prompt "description" --provider higgsfield --model soul --output ./out.png
```

### Video generation (Higgsfield only)

```bash
mediagen video generate --image ./input.png --prompt "cinematic zoom" --provider higgsfield --output ./out.mp4
mediagen video generate --image ./input.png --prompt "slow pan" --model dop-standard --provider higgsfield --output ./out.mp4
```

### Discovery

```bash
mediagen models                    # list models for current provider
mediagen models --provider freepik # list Freepik models
mediagen styles                    # list image styles
mediagen config                    # show current provider and credentials
mediagen config providers          # list available providers
```

### Provider management

```bash
mediagen config set provider gemini          # switch to Gemini (free tier)
mediagen config set provider freepik         # switch to Freepik
mediagen config set provider higgsfield      # switch to Higgsfield
mediagen config set api-key YOUR_KEY         # save API key for current provider
mediagen config remove freepik               # remove credentials
```

### Available models

Gemini: gemini-flash (2.5 Flash), gemini-flash-preview (3.1 Flash), gemini-pro-preview (3 Pro)
Freepik: mystic, flux-2-pro, flux-2-klein, flux-kontext, flux-pro, flux-dev, hyperflux, seedream-4.5, seedream-4, runway
Higgsfield: soul, reve, seedream, dop-preview, dop-standard, seedance, kling

### Parameters

- `--size`: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
- `--quality`: resolution (1K, 2K, 4K — Gemini preview models only)
- `--model`: model ID from the list above
- `--provider`: override default provider for this command
- `--output, -o`: save result to local file
- `--json`: machine-readable output
- `--no-poll`: return request ID without waiting (no effect on Gemini)

### Rules

- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- For web banners/heroes, use `--size 16:9`; for social/square, use `--size 1:1`
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
- Prefer Gemini provider for free/low-cost usage, Freepik for variety of models
