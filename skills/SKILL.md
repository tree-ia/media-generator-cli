---
name: mediagen
description: Generate AI images and videos for web development using the mediagen CLI. Use when the user asks to generate, create, or produce images, videos, banners, hero images, icons, or any visual asset for a project.
allowed-tools: Bash, Read, Write
---

## mediagen CLI

A CLI tool for generating images and videos using AI providers (currently Higgsfield).

### Quick start

Run `mediagen --help` to see all commands. Each subcommand has detailed `--help`.

### Image generation

```bash
mediagen image generate --prompt "description" --output ./path/to/file.png
mediagen image generate --prompt "description" --size 2048x1152 --quality 1080p --output ./public/hero.png
mediagen image generate --prompt "description" --style <style-id> --style-strength 0.8 --output ./out.png
mediagen image generate --prompt "description" --character <id> --output ./out.png
```

### Video generation

```bash
mediagen video generate --image ./input.png --prompt "cinematic zoom" --output ./out.mp4
mediagen video generate --image ./input.png --prompt "slow pan" --model dop-turbo --output ./out.mp4
```

### Discovery commands

```bash
mediagen models       # list available models
mediagen styles       # list image styles (for --style flag)
mediagen motions      # list video motion presets (for --motion flag)
mediagen characters list   # list saved characters
```

### Upload & characters

```bash
mediagen upload ./image.png                                           # get public URL
mediagen characters create --name "Name" --images ./ref1.png ./ref2.png  # create character
```

### Rules

- Save generated assets in the project's `public/` directory unless told otherwise
- Use descriptive filenames: `hero-construction-site.png`, not `output.png`
- For web assets, prefer 2048x1152 (landscape) or 1536x1536 (square)
- Always use `--output` to save locally — don't leave assets as URLs only
- Use `--json` flag when you need to parse the output programmatically
