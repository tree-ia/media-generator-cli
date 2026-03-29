---
name: mediagen
description: Generate AI images and videos for web development using the mediagen CLI. Use when the user asks to generate, create, or produce images, videos, banners, hero images, icons, or any visual asset for a project.
allowed-tools: Bash, Read, Write
---

## mediagen CLI

CLI for AI media generation. Supports multiple providers (Gemini, Freepik, Higgsfield, Runway, Kling).

Run `mediagen --help` to see all commands. Each subcommand has detailed `--help`.

### Image generation

```bash
mediagen image generate --prompt "description" --output ./path/to/file.png
mediagen image generate --prompt "description" --size 16:9 --quality 2k --output ./public/hero.png
mediagen image generate --prompt "description" --provider gemini --model gemini-flash --output ./out.png
mediagen image generate --prompt "description" --provider freepik --model flux-2-pro --output ./out.png
mediagen image generate --prompt "description" --provider higgsfield --model soul --output ./out.png
```

### Video generation (Higgsfield, Runway, Kling)

```bash
# Image-to-video
mediagen video generate --image ./input.png --prompt "cinematic zoom" --provider higgsfield --output ./out.mp4
mediagen video generate --image ./input.png --prompt "slow pan" --provider runway --model gen4-turbo --output ./out.mp4

# Text-to-video (Runway gen4.5 and Kling only — no --image needed)
mediagen video generate --prompt "sunset timelapse over mountains" --provider runway --model gen4.5 --output ./out.mp4
mediagen video generate --prompt "ocean waves on beach" --provider kling --duration 10 --output ./out.mp4
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
# Set default providers
mediagen config set image-provider freepik       # default for image generation
mediagen config set video-provider runway        # default for video generation

# Set API credentials (always specify --provider)
mediagen config set api-key YOUR_KEY --provider gemini
mediagen config set api-key YOUR_KEY --provider runway
mediagen config set api-key YOUR_KEY --provider kling
mediagen config set api-secret YOUR_SECRET --provider kling
mediagen config remove freepik                   # remove credentials
```

### Available models

Gemini: gemini-flash (2.5 Flash), gemini-flash-preview (3.1 Flash), gemini-pro-preview (3 Pro)
Freepik: mystic, flux-2-pro, flux-2-klein, flux-kontext, flux-pro, flux-dev, hyperflux, seedream-4.5, seedream-4, runway
Higgsfield: soul, reve, seedream, dop-preview, dop-standard, seedance, kling
Runway: gen4-image, gen4-image-turbo (image), gen3a-turbo, gen4-turbo, gen4.5 (video)
Kling: kling-img-v2, kling-img-v2.1 (image), kling-v2-master, kling-v2.1-master, kling-v2.5-turbo (video)

### Parameters

- `--size`: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
- `--quality`: resolution (1K, 2K, 4K — Gemini preview models only)
- `--model`: model ID from the list above
- `--provider`: override default provider for this command
- `--output, -o`: save result to local file
- `--duration`: video duration in seconds (5 or 10 — Runway, Kling)
- `--json`: machine-readable output
- `--no-poll`: return request ID without waiting (no effect on Gemini)

### Rules

- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- For web banners/heroes, use `--size 16:9`; for social/square, use `--size 1:1`
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
- Prefer Gemini provider for free/low-cost usage, Freepik for variety of image models
- For video generation, use Runway (gen4-turbo for value, gen4.5 for quality) or Kling
- Runway gen4.5 and Kling support text-to-video (no image required)
