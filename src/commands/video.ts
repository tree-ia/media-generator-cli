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
    .option('-i, --image <path-or-url>', 'Input image (local file or URL). Required for some providers.')
    .requiredOption('-p, --prompt <text>', 'Text prompt describing the motion/scene')
    .option('-m, --model <model>', 'Video model (default varies by provider). Run "mediagen models" to list.')
    .option('-s, --size <ratio>', 'Aspect ratio: 16:9, 9:16, 1:1, 4:3, 3:4')
    .option('-d, --duration <seconds>', 'Video duration: 5 or 10 seconds', parseInt)
    .option('--negative-prompt <text>', 'Elements to exclude from generation (Kling)')
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
  $ mediagen video generate --image ./photo.png --prompt "slow pan" --model seedance --output ./hero.mp4
  $ mediagen video generate --prompt "sunset timelapse" --provider runway --model gen4.5 --output ./out.mp4
  $ mediagen video generate --prompt "ocean waves" --provider kling --duration 10 --output ./out.mp4
  $ mediagen video generate --image ./img.png --prompt "dramatic" --provider runway --duration 5

Models vary by provider. Run "mediagen models --provider <name>" for the full list.
Video providers: higgsfield, runway, kling.
Runway (gen4.5) and Kling support text-to-video (no --image needed).
Use --duration 5 or --duration 10 for video length (runway, kling).`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.videoProvider
      const provider = getProvider(providerName, config)

      const spinner = ora('Generating video...').start()

      try {
        const result = await provider.generateVideo({
          image: opts.image,
          prompt: opts.prompt,
          model: opts.model,
          size: opts.size,
          duration: opts.duration,
          negativePrompt: opts.negativePrompt,
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
