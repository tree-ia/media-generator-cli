import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createModelsCommand(): Command {
  return new Command('models')
    .description('List available models')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen models
  $ mediagen models --provider higgsfield
  $ mediagen models --json`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      try {
        const models = await provider.listModels()

        if (opts.json) {
          out.json(models)
          return
        }

        out.table(
          ['ID', 'Name', 'Type', 'Description'],
          models.map((m) => [m.id, m.name, m.type, m.description ?? ''])
        )
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
