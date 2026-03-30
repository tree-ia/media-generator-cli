import { Command } from 'commander'
import ora from 'ora'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import { downloadToFile, inferExtension } from '../utils/download.js'
import * as out from '../utils/output.js'

function collect(value: string, previous: string[]): string[] {
  return [...previous, value]
}

export function createImageCommand(): Command {
  const image = new Command('image').description('Image generation commands')

  image
    .command('generate')
    .description('Generate an image from a text prompt')
    .requiredOption('-p, --prompt <text>', 'Text prompt describing the image')
    .option('-i, --image <path>', 'Reference image (local file or URL, repeat for multiple)', collect, [])
    .option('-m, --model <model>', 'Model to use (default varies by provider)')
    .option('-s, --size <ratio>', 'Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:2, 21:9')
    .option('-q, --quality <res>', 'Resolution: 720p, 1080p, 2K, 4K')
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
  $ mediagen image generate --prompt "hero banner" --size 16:9 --quality 720p --output ./public/hero.png
  $ mediagen image generate --prompt "landscape" --model seedream --size 16:9 --output ./bg.png
  $ mediagen image generate --prompt "match this brand style" --image ./logo.png --provider gemini --output ./hero.png
  $ mediagen image generate --prompt "combine these styles" --image ./ref1.png --image ./ref2.png --provider gemini
  $ mediagen image generate --prompt "test" --no-poll

Models vary by provider. Run "mediagen models" for the full list.

Parameters:
  --image: reference image (repeat for multiple, Gemini up to 14, Runway up to 3)
  --size: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
  --quality: resolution (1K, 2K, 4K)
  --provider: override default provider (gemini, freepik, higgsfield, runway, kling)`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      const spinner = ora('Generating image...').start()

      try {
        const result = await provider.generateImage({
          prompt: opts.prompt,
          images: opts.image.length > 0 ? opts.image : undefined,
          model: opts.model,
          size: opts.size,
          quality: opts.quality,
          output: opts.output,
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

        if (result.localPath) {
          out.success(`Saved to: ${result.localPath}`)
        } else if (result.url) {
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
