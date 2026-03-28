import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createStylesCommand(): Command {
  return new Command('styles')
    .description('List available image styles (Soul model)')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen styles
  $ mediagen styles --json

Use a style ID with image generation:
  $ mediagen image generate --prompt "landscape" --style <style-id> --style-strength 0.8`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.provider
      const provider = getProvider(providerName, config)

      try {
        const styles = await provider.listStyles()

        if (opts.json) {
          out.json(styles)
          return
        }

        if (styles.length === 0) {
          out.warn('No styles available for this provider.')
          return
        }

        out.table(
          ['ID', 'Name', 'Description'],
          styles.map((s) => [s.id, s.name, s.description ?? ''])
        )
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
