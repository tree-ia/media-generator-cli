---
name: mediagen
description: Generate AI images and videos for web development using the mediagen CLI. Use when the user asks to generate, create, or produce images, videos, banners, hero images, icons, or any visual asset for a project.
allowed-tools: Bash, Read, Write
---

## mediagen CLI

CLI for AI media generation. Supports multiple providers (Freepik, Higgsfield).

Run `mediagen --help` to see all commands. Each subcommand has detailed `--help`.

### Image generation

```bash
mediagen image generate --prompt "description" --output ./path/to/file.png
mediagen image generate --prompt "description" --size 16:9 --quality 2k --output ./public/hero.png
mediagen image generate --prompt "description" --model flux-2-pro --output ./out.png
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
mediagen config set provider freepik         # switch to Freepik
mediagen config set provider higgsfield      # switch to Higgsfield
mediagen config set api-key YOUR_KEY         # save API key for current provider
mediagen config remove freepik               # remove credentials
```

### Available models

Freepik (default): mystic, flux-2-pro, flux-2-klein, flux-kontext, flux-pro, flux-dev, hyperflux, seedream-4.5, seedream-4, runway
Higgsfield: soul, reve, seedream, dop-preview, dop-standard, seedance, kling

### Parameters

- `--size`: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
- `--quality`: resolution (720p, 1080p, 2k, 4k)
- `--model`: model ID from the list above
- `--provider`: override default provider for this command
- `--output, -o`: save result to local file
- `--json`: machine-readable output
- `--no-poll`: return request ID without waiting

### Rules

- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- For web banners/heroes, use `--size 16:9`; for social/square, use `--size 1:1`
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
- Prefer Freepik provider (default) — lower cost, more models
