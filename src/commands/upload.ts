import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createUploadCommand(): Command {
  return new Command('upload')
    .description('Upload a local image and get a public URL')
    .argument('<file>', 'Path to the image file')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen upload ./reference.png
  $ mediagen upload ./photo.jpg --json

The returned URL can be used with video generation:
  $ mediagen video generate --image <url> --prompt "cinematic zoom"`
    )
    .action(async (file: string, opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      try {
        const url = await provider.upload(file)

        if (opts.json) {
          out.json({ url })
          return
        }

        out.success(`Uploaded: ${url}`)
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
