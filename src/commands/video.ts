import { Command } from 'commander'
import ora from 'ora'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import { downloadToFile, inferExtension } from '../utils/download.js'
import * as out from '../utils/output.js'

export function createVideoCommand(): Command {
  const video = new Command('video').description('Video generation commands')

  video
    .command('generate')
    .description('Generate a video from an image and text prompt')
    .requiredOption('-i, --image <path-or-url>', 'Input image (local file or URL)')
    .requiredOption('-p, --prompt <text>', 'Text prompt describing the motion/scene')
    .option('-m, --model <model>', 'DoP model: dop-lite, dop-turbo, dop-standard (default: dop-standard)', 'dop-standard')
    .option('-o, --output <path>', 'Save video to local file')
    .option('--motion <id>', 'Motion preset ID (use "mediagen motions" to list)')
    .option('--motion-strength <n>', 'Motion strength 0.0-1.0 (default: 0.5)', parseFloat)
    .option('--seed <n>', 'Seed for reproducibility (0-1000000)', parseInt)
    .option('--no-poll', 'Return request ID without waiting for completion')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen video generate --image ./hero.png --prompt "cinematic zoom out"
  $ mediagen video generate --image https://example.com/img.png --prompt "slow pan" --model dop-turbo
  $ mediagen video generate --image ./photo.png --prompt "dramatic" --motion abc123 --output ./hero.mp4
  $ mediagen video generate --image ./img.png --prompt "test" --no-poll

Models:
  dop-lite       Basic quality, fastest
  dop-turbo      2x speed, priority queue
  dop-standard   Highest quality, priority queue (default)`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.provider
      const provider = getProvider(providerName, config)

      const spinner = ora('Generating video...').start()

      try {
        const result = await provider.generateVideo({
          image: opts.image,
          prompt: opts.prompt,
          model: opts.model,
          motion: opts.motion,
          motionStrength: opts.motionStrength,
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
              : opts.output + inferExtension(result.url, 'video')

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

  return video
}
