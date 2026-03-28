import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Check the status of a generation request')
    .argument('<request-id>', 'The request/job-set ID to check')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen status abc123-def456
  $ mediagen status abc123-def456 --json`
    )
    .action(async (requestId: string, opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.provider
      const provider = getProvider(providerName, config)

      try {
        const result = await provider.getStatus(requestId)

        if (opts.json) {
          out.json(result)
          return
        }

        out.info(`Request ID: ${result.requestId}`)
        out.info(`Status: ${out.statusColor(result.status)}`)

        if (result.url) {
          out.success(`URL: ${result.url}`)
        }
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
