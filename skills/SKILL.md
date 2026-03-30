---
name: mediagen
description: Generate AI images and videos for web development using the mediagen CLI. Use when the user asks to generate, create, or produce images, videos, banners, hero images, icons, or any visual asset for a project.
allowed-tools: Bash, Read, Write, Glob, Grep
---

## mediagen CLI

CLI for AI media generation. Supports multiple providers (Gemini, Freepik, Higgsfield, Runway, Kling).

Run `mediagen --help` to see all commands. Each subcommand has detailed `--help`.

---

### CRITICAL: Context Analysis Protocol

**Before generating ANY asset, you MUST analyze the project context. This is mandatory — never skip.**

#### Step 1: Identify the project

```
Read package.json → name, framework (Next.js, Expo, Express), description
Read README.md (first 50 lines) → project purpose, target audience
```

Determine project type:
- **Landing page**: Hero images, feature illustrations, testimonials, social proof
- **Dashboard**: Empty states, data illustrations, onboarding graphics
- **E-commerce**: Product photos, banners, promotional assets
- **Mobile app**: Splash screens, onboarding illustrations, app store screenshots
- **Portfolio/Blog**: Hero backgrounds, article headers, profile images

#### Step 2: Extract visual identity

```
Read tailwind.config.* → colors (primary, secondary, accent), fonts, border-radius
Read globals.css or theme file → CSS variables, color scheme
Read public/ directory → existing logos, favicon, brand assets
Read the component/page where the asset will be placed → layout context
```

From this, determine:
- **Brand colors**: Extract hex values (e.g., primary: #1E40AF, accent: #F59E0B)
- **Visual tone**: Corporate, playful, tech-minimal, editorial, organic, luxury
- **Typography style**: Geometric sans-serif, rounded, serif, monospace
- **Existing asset style**: Photographic, illustrated, 3D, flat/vector, gradient

#### Step 3: Build a contextual prompt

Incorporate what you found:
- Name colors explicitly: `"deep blue #1E40AF accent lighting"`, `"warm amber #F59E0B highlights"`
- Match tone: corporate → clean/professional; playful → vibrant/dynamic; tech → minimal/geometric
- Reference design language: `"matching the minimal geometric style of the existing brand"`
- Consider component context: hero needs negative space for text overlay, cards need centered subjects

#### Step 4: Use reference images when available

If you found a logo or relevant assets in `public/`, pass them as `--image`:

```bash
# Pass the logo so the model can match the brand style
mediagen image generate --prompt "hero banner with deep blue #1E40AF tones, minimal geometric style" \
  --image ./public/logo.png --provider gemini --size 16:9 --output ./public/hero.png
```

---

### Image generation

```bash
mediagen image generate --prompt "description" --output ./path/to/file.png
mediagen image generate --prompt "description" --size 16:9 --quality 2k --output ./public/hero.png
mediagen image generate --prompt "description" --provider gemini --model gemini-flash --output ./out.png
mediagen image generate --prompt "description" --provider freepik --model flux-2-pro --output ./out.png
mediagen image generate --prompt "description" --provider higgsfield --model soul --output ./out.png
```

#### Reference images (image-to-image)

```bash
# Single reference — brand-aware generation
mediagen image generate --prompt "hero banner matching this brand" \
  --image ./public/logo.png --provider gemini --output ./public/hero.png

# Multiple references — combine brand + style (Gemini up to 14, Runway up to 3)
mediagen image generate --prompt "team page header combining brand identity with this visual style" \
  --image ./public/logo.png --image ./public/existing-hero.png \
  --provider gemini --size 16:9 --output ./public/team-hero.png

# Runway with @ref tags — model uses tags for subject/style control
mediagen image generate --prompt "a scene inspired by @ref1 in the style of @ref2" \
  --image ./subject-photo.png --image ./style-ref.png \
  --provider runway --output ./out.png

# Freepik Kontext — context-aware edit from single image
mediagen image generate --prompt "change the background to a tropical beach" \
  --image ./original.png --provider freepik --model flux-kontext --output ./edited.png
```

### Video generation (Higgsfield, Runway, Kling)

```bash
# Image-to-video
mediagen video generate --image ./input.png --prompt "cinematic zoom" --provider higgsfield --output ./out.mp4
mediagen video generate --image ./input.png --prompt "slow pan" --provider runway --model gen4-turbo --output ./out.mp4

# Text-to-video (Runway gen4.5 and Kling only — no --image needed)
mediagen video generate --prompt "sunset timelapse over mountains" --provider runway --model gen4.5 --output ./out.mp4
mediagen video generate --prompt "ocean waves on beach" --provider kling --duration 10 --output ./out.mp4

# Start + end frame (Runway only, max 2 images)
mediagen video generate --image ./start-frame.png --image ./end-frame.png \
  --prompt "smooth cinematic transition" --provider runway --model gen4.5 --output ./transition.mp4
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

- `--image, -i`: reference image (repeat for multiple). Gemini up to ~14, Runway up to 3 (image) / 2 (video), Freepik Kontext 1
- `--size`: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
- `--quality`: resolution (1K, 2K, 4K — Gemini preview models only)
- `--model`: model ID from the list above
- `--provider`: override default provider for this command
- `--output, -o`: save result to local file
- `--duration`: video duration in seconds (5 or 10 — Runway, Kling)
- `--json`: machine-readable output
- `--no-poll`: return request ID without waiting (no effect on Gemini)

### Reference image support by provider

| Provider | Image gen | Video gen | Max | How it works |
|----------|-----------|-----------|-----|--------------|
| **Gemini** | multimodal inline | — | ~14 | Images added as inline_data parts. Best for brand matching. |
| **Runway** | referenceImages + @tags | first/last frame | 3 / 2 | Image: refs tagged @ref1, @ref2. Video: start + end keyframes. |
| **Freepik** | Kontext model only | — | 1 | Context-aware editing. Use `--model flux-kontext`. |
| **Higgsfield** | — | single image | 1 | Image-to-video only (upload to CDN). |
| **Kling** | — | single image | 1 | Image-to-video only (base64 data URI). |

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
| Brand-aware (with logo) | Gemini / gemini-flash or pro-preview | Best multimodal reference |
| Style transfer (with ref) | Runway / gen4-image | @tag referencing |
| Image editing (with ref) | Freepik / flux-kontext | Context-aware editing |
| Video (best value) | Runway / gen4-turbo | $0.05/sec |
| Video (highest quality) | Runway / gen4.5 | Text-to-video + image-to-video |
| Video (text-to-video) | Runway / gen4.5 or Kling | No source image needed |
| Video (start+end frames) | Runway / gen4.5 or gen4-turbo | Two-image keyframe control |
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

---

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

---

### Provider-specific prompt optimization

**Gemini (best for brand-aware with reference images):**
- Works best with descriptive, conversational prompts
- When using `--image`, describe what you want the output to incorporate from the reference
- Example: `"Create a professional hero banner that uses the same color palette and visual style as this logo, with a modern cityscape at sunset and space on the right side for text overlay"`
- Handles long prompts well (up to 100+ words)
- Specify output format needs: `"as a clean PNG with transparent background"` (when supported)

**Freepik Mystic (best for photorealistic):**
- Responds well to photography-specific terms: lens, f-stop, lighting setup
- Style keywords matter: use `--style realism` or `--style super_real` for photography
- Avoid the word "background" — causes blurriness
- Example: `"professional headshot, studio lighting, 85mm f/1.4, shallow depth of field, neutral gray backdrop"`

**Freepik Flux Kontext (best for image editing):**
- Prompt describes the CHANGE, not the full scene
- Example with `--image`: `"change the sky to a dramatic sunset"`, `"add a coffee cup on the desk"`
- Keep edit prompts short and specific (10-30 words)

**Freepik Seedream (best for artistic/creative):**
- Excels at illustration, concept art, cinematic compositions
- Reference art movements and styles explicitly
- Example: `"digital concept art, ethereal forest with bioluminescent plants, Studio Ghibli-inspired color palette"`

**Runway Gen-4 Image (best for style transfer with @tags):**
- Use `@ref1`, `@ref2` in prompt to reference specific input images
- Each reference is tagged automatically: first `--image` → `@ref1`, second → `@ref2`
- Example: `"a modern living room featuring furniture in the style of @ref1 with the color scheme of @ref2"`
- Max 3 reference images

**Higgsfield Soul (good general purpose):**
- Photography and editorial terms work well
- Good for fashion, product, and lifestyle imagery
- Example: `"editorial fashion photography, model in urban setting, cinematic color grading, golden hour"`

---

### Project type templates

**Landing page hero:**
```bash
# Read project → extract colors → generate with negative space for text
mediagen image generate \
  --prompt "modern tech hero image, deep blue #1E40AF and white color scheme, abstract geometric shapes floating in space, clean minimal composition, open area on the left for headline text, subtle gradient, professional and innovative mood" \
  --image ./public/logo.png --provider gemini --size 16:9 --output ./public/hero.png
```

**Dashboard empty state:**
```bash
mediagen image generate \
  --prompt "minimal line illustration of an empty inbox, soft blue #60A5FA and gray tones, friendly and inviting, centered composition, white background, clean vector style" \
  --provider gemini --size 1:1 --output ./public/empty-state.png
```

**E-commerce product:**
```bash
mediagen image generate \
  --prompt "product photography, clean white background, soft studio lighting, centered composition, subtle shadow, professional e-commerce style" \
  --image ./product-raw.jpg --provider freepik --model flux-kontext --size 1:1 --output ./public/product.png
```

**Mobile app splash screen:**
```bash
mediagen image generate \
  --prompt "gradient splash screen background, deep purple #7C3AED to blue #3B82F6 gradient, subtle abstract mesh pattern, centered glow effect, mobile-optimized" \
  --size 9:16 --provider gemini --output ./assets/splash.png
```

**Blog article header:**
```bash
mediagen image generate \
  --prompt "editorial photography style header for tech blog, laptop on wooden desk with warm morning light, bokeh background, professional and inviting, shot on 50mm f/2.8" \
  --size 16:9 --provider freepik --model mystic --style realism --output ./public/blog-header.png
```

**Background video for landing page:**
```bash
# First generate a still, then animate it
mediagen image generate --prompt "abstract flowing particles, dark navy #0F172A background, subtle blue #3B82F6 glow" \
  --size 16:9 --provider gemini --output ./public/bg-still.png

mediagen video generate --image ./public/bg-still.png \
  --prompt "extremely slow drift, particles floating gently, subtle ambient motion, static camera" \
  --provider runway --model gen4-turbo --duration 5 --output ./public/bg-video.mp4
```

---

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

**Start + end frame (Runway only):**
- Pass two `--image` flags: first image = opening frame, second = closing frame
- The model interpolates between them smoothly
- Great for: product transitions, scene morphs, before/after reveals
- Example: `"smooth cinematic transition, gentle camera movement"`

**Source image tips (image-to-video):**
- Use high-quality, artifact-free images — flaws get amplified
- Images with implied motion (mid-action poses, motion blur) animate better
- Avoid source images with text/watermarks — they distort during animation

**Web motion design:**
- Hero background videos: `"static shot"` or `"extremely slow push in"`, atmospheric motion, 5s
- Product showcases: `"slow orbit"` or `"push in"`, 5s
- Keep motion subtle — visitors should not be distracted from content

---

### Contextual generation workflow

When generating assets for a web project, follow this workflow:

1. **Analyze** — Read the project structure, theme, and component context (Steps 1-4 above)
2. **Prototype** — Generate with a fast/free model (gemini-flash, flux-2-klein) to test composition
3. **Refine** — Adjust the prompt based on the prototype result
4. **Produce** — Regenerate with a high-quality model (mystic, gemini-pro-preview, gen4-image)
5. **Upscale** — Use `--quality 2K` or `--quality 4K` for the final asset (Gemini preview models)

Use `--seed` to maintain consistency across multiple related generations (same seed = same composition).

For multiple assets in a series (e.g., feature illustrations), use the same:
- Seed number
- Style keywords
- Color palette references
- Reference images (pass the first generated asset as `--image` to maintain consistency)

---

### Rules

- **Always analyze the project context before generating** — never generate blindly
- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
- Use `--seed` for consistency across multiple related generations
- When generating for a project with existing assets, pass the logo or brand assets as `--image` for visual coherence (use Gemini for best multimodal support)
- If a generation returns `status: 'nsfw'`, rephrase with more formal/academic language and retry
- Match the asset style to the project's existing visual language — don't generate photorealistic images for a flat-design site
- For hero images, always include negative space direction: `"open area on the left/right for text"`
- Generate desktop (16:9) and mobile (9:16) versions separately for responsive hero sections
