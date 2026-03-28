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
    .option('-m, --model <model>', 'Model to use (default: soul)', 'soul')
    .option('-s, --size <WxH>', 'Image size, e.g. 2048x1152 (default: 1536x1536)', '1536x1536')
    .option('-q, --quality <quality>', 'Quality: 720p or 1080p (default: 1080p)', '1080p')
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
  $ mediagen image generate --prompt "hero banner" --size 2048x1152 --output ./public/hero.png
  $ mediagen image generate --prompt "worker portrait" --character abc123 --quality 1080p
  $ mediagen image generate --prompt "abstract pattern" --style xyz789 --style-strength 0.8
  $ mediagen image generate --prompt "test" --no-poll  # returns request ID immediately

Available sizes:
  2048x1152, 2048x1536, 2016x1344, 1696x960, 1632x1088,
  1536x1536 (default), 1536x1152, 1152x1536, 1152x2048,
  1536x2048, 1344x2016, 960x1696, 1088x1632`
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
