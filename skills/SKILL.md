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

### Model selection

| Use case | Provider / Model | Why |
|----------|-----------------|-----|
| Free / low-cost | Gemini / gemini-flash | Free tier, fast |
| Highest image quality | Gemini / gemini-pro-preview | 2K/4K support |
| Photorealistic | Freepik / mystic (realism) or flux-2-pro | Hyper-realistic textures |
| Artistic / illustration | Freepik / seedream-4.5 | Creative, cinematic |
| Fast prototyping | Freepik / flux-2-klein or hyperflux | Sub-second generation |
| Text in images | Gemini or Freepik / mystic | Better text rendering |
| Brand colors (hex) | Freepik / flux-2-pro | Supports hex color codes |
| Video (best value) | Runway / gen4-turbo | $0.05/sec |
| Video (highest quality) | Runway / gen4.5 | Text-to-video + image-to-video |
| Video (text-to-video) | Runway / gen4.5 or Kling | No source image needed |
| Video (fast preview) | Higgsfield / dop-preview | Quick drafts |

### Aspect ratios

| Ratio | Use case |
|-------|----------|
| 16:9 | Hero banners, desktop headers, YouTube thumbnails, OG images |
| 9:16 | Instagram/TikTok stories, mobile heroes, vertical video |
| 1:1 | Instagram feed, profile pictures, product thumbnails, app icons |
| 4:3 | Blog images, presentation slides |
| 3:2 | Standard photography, email headers |
| 21:9 | Cinematic banners, ultrawide backgrounds, panoramic scenes |

### Prompt best practices

**Structure (priority order):** `[Style/Medium] + [Subject] + [Action] + [Setting] + [Lighting] + [Composition]`
- Word order matters — models pay more attention to what comes first
- 30-80 words is the sweet spot for most use cases
- Start short, add detail if the result isn't specific enough

**Photorealistic prompts:**
- Use camera terminology: `"shot on 85mm lens, f/1.8, natural light"`
- Reference lighting: `"golden hour rim lighting"`, `"soft studio light"`, `"volumetric light"`

**Artistic prompts:**
- Name the medium: `"watercolor illustration"`, `"oil painting"`, `"vector flat design"`
- Reference art styles: `"art nouveau"`, `"bauhaus"`, `"impressionist"`

**Text in images:**
- Always enclose text in quotes: `"a neon sign reading 'OPEN'"`
- Specify font style: `"bold sans-serif"`, `"elegant serif"`, `"neon cursive"`
- Best models: Gemini, mystic. Worst: flux-2-klein, hyperflux (too fast)

**Avoid:**
- Generic quality tokens like `"4K, masterpiece, highly detailed"` — describe actual details instead
- Negative phrasing on Flux/Runway models (no negative prompt support) — describe what you WANT
- Over-detailed prompts (100+ words) — models ignore parts arbitrarily
- The word `"background"` on Mystic (causes blurriness)

### Web asset guidelines

**Hero sections:**
- Use `--size 16:9`, minimum 1920x1080
- Prompt for negative space: `"open sky on the right for text overlay"`
- Dark/muted backgrounds for light text; bright scenes for dark text
- Consider separate desktop (16:9) and mobile (9:16) versions

**Product photos:**
- Use `--size 1:1` for e-commerce grids
- Prompt: `"product photography, studio lighting, white background, sharp focus"`

**Background textures:**
- Use `--size 1:1` for tiling patterns
- Prompt for subtle patterns: `"seamless texture, muted colors, subtle gradient"`

**Performance workflow:**
1. Prototype with fast/free models (gemini-flash, flux-2-klein)
2. Pick the best composition and prompt
3. Regenerate with high-quality model (mystic, gemini-pro-preview)
4. Use `--quality 2K` or `--quality 4K` for final asset

### Video prompt guidelines

**Prompt structure:** `[Camera movement] + [Speed] + [Subject motion] + [Atmosphere]`
- Focus on MOTION, not appearance — the model sees the source image
- Use active verbs: `"glides"`, `"drifts"`, `"swirls"`, `"rushes"`
- Always specify camera movement explicitly

**Camera movements:**
- `"slow pan right"` — horizontal rotation
- `"tilt up"` — vertical rotation revealing height
- `"push in"` / `"dolly in"` — approach the subject
- `"pull back"` — reveal wider scene
- `"orbit"` — circle around subject
- `"crane up"` — sweep upward and away
- `"tracking shot"` — follow a moving subject
- `"static shot"` — camera fixed, only subject moves

**Duration:**
- 5 seconds: single camera movement, product showcase, ambient motion
- 10 seconds: complex motion, multiple movements, narrative sequences

**Source image tips (image-to-video):**
- Use high-quality, artifact-free images — flaws get amplified
- Images with implied motion (mid-action poses, motion blur) animate better
- Avoid source images with text/watermarks — they distort during animation

**Web motion design:**
- Hero background videos: `"static shot"` or `"extremely slow push in"`, atmospheric motion, 5s
- Product showcases: `"slow orbit"` or `"push in"`, 5s
- Keep motion subtle — visitors should not be distracted from content

### Rules

- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
- Use `--seed` for consistency across multiple related generations
- If a generation returns `status: 'nsfw'`, rephrase with more formal/academic language and retry
