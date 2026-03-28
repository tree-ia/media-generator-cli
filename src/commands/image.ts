import { Command } from 'commander'
import ora from 'ora'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import { downloadToFile, inferExtension } from '../utils/download.js'
import * as out from '../utils/output.js'

export function createImageCommand(): Command {
  const image = new Command('image').description('Image generation commands')

  image
    .command('generate')
    .description('Generate an image from a text prompt')
    .requiredOption('-p, --prompt <text>', 'Text prompt describing the image')
    .option('-m, --model <model>', 'Model to use (default: nano-banana-2)')
    .option('-s, --size <size>', 'Size: aspect ratio for V2 (1:1, 16:9) or WxH for Soul (2048x1152)')
    .option('-q, --quality <quality>', 'Quality/resolution: 0.5K, 1K, 2K (default), 4K for V2; 720p, 1080p for Soul')
    .option('-o, --output <path>', 'Save image to local file')
    .option('--style <id>', 'Style ID (use "mediagen styles" to list)')
    .option('--style-strength <n>', 'Style strength 0.0-1.0', parseFloat)
    .option('--character <id>', 'Character/SoulId for consistency (use "mediagen characters list")')
    .option('--character-strength <n>', 'Character strength 0.0-1.0', parseFloat)
    .option('--seed <n>', 'Seed for reproducibility (0-1000000)', parseInt)
    .option('--no-poll', 'Return request ID without waiting for completion')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen image generate --prompt "modern office building at sunset"
  $ mediagen image generate --prompt "hero banner" --size 16:9 --quality 4K --output ./public/hero.png
  $ mediagen image generate --prompt "logo design" --model nano-banana-pro --output ./logo.png
  $ mediagen image generate --prompt "landscape" --model seedream --size 16:9 --output ./bg.png
  $ mediagen image generate --prompt "portrait" --model soul --size 1152x2048 --quality 1080p
  $ mediagen image generate --prompt "test" --no-poll

Models (run "mediagen models" for full list):
  nano-banana-2  (default) Fast, Gemini-based, 0.5K-4K
  nano-banana-pro          High quality, detailed
  flux-kontext             Flux Kontext Max
  seedream                 ByteDance Seedream v4
  soul                     Higgsfield Soul (legacy V1, supports styles/characters)

V2 models (nano-banana, flux, seedream):
  --size: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
  --quality: resolution (0.5K, 1K, 2K, 4K)

Soul model (V1):
  --size: pixel dimensions (2048x1152, 1536x1536, etc.)
  --quality: 720p or 1080p
  --style, --character: only available with Soul`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.provider
      const provider = getProvider(providerName, config)

      const spinner = ora('Generating image...').start()

      try {
        const result = await provider.generateImage({
          prompt: opts.prompt,
          model: opts.model,
          size: opts.size,
          quality: opts.quality,
          style: opts.style,
          styleStrength: opts.styleStrength,
          character: opts.character,
          characterStrength: opts.characterStrength,
          seed: opts.seed,
          noPoll: !opts.poll,
        })

        spinner.stop()

        if (opts.json) {
          out.json(result)
          return
        }

        out.info(`Request ID: ${result.requestId}`)
        out.info(`Status: ${out.statusColor(result.status)}`)

        if (result.url) {
          out.success(`URL: ${result.url}`)

          if (opts.output) {
            const outputPath = opts.output.includes('.')
              ? opts.output
              : opts.output + inferExtension(result.url, 'image')

            const dlSpinner = ora('Downloading...').start()
            await downloadToFile(result.url, outputPath)
            dlSpinner.stop()
            out.success(`Saved to: ${outputPath}`)
          }
        } else if (result.status === 'queued' || result.status === 'in_progress') {
          out.warn('Generation in progress. Check status with:')
          console.log(`  mediagen status ${result.requestId}`)
        }
      } catch (err) {
        spinner.stop()
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  return image
}
