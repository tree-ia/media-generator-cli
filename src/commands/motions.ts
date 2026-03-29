import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createMotionsCommand(): Command {
  return new Command('motions')
    .description('List available video motion presets (DoP model)')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen motions
  $ mediagen motions --json

Use a motion ID with video generation:
  $ mediagen video generate --image ./img.png --prompt "scene" --motion <motion-id>`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      try {
        const motions = await provider.listMotions()

        if (opts.json) {
          out.json(motions)
          return
        }

        if (motions.length === 0) {
          out.warn('No motions available for this provider.')
          return
        }

        out.table(
          ['ID', 'Name', 'Description'],
          motions.map((m) => [m.id, m.name, m.description ?? ''])
        )
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
