import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { getProvider } from '../providers/registry.js'
import * as out from '../utils/output.js'

export function createCharactersCommand(): Command {
  const characters = new Command('characters').description(
    'Manage reusable characters for visual consistency'
  )

  characters
    .command('list')
    .description('List all saved characters')
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen characters list
  $ mediagen characters list --json`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      try {
        const chars = await provider.listCharacters()

        if (opts.json) {
          out.json(chars)
          return
        }

        if (chars.length === 0) {
          out.warn('No characters found. Create one with:')
          console.log('  mediagen characters create --name "Name" --images ./ref.png')
          return
        }

        out.table(
          ['ID', 'Name', 'Status'],
          chars.map((c) => [c.id, c.name, out.statusColor(c.status)])
        )
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  characters
    .command('create')
    .description('Create a new character from reference images')
    .requiredOption('-n, --name <name>', 'Character name')
    .requiredOption(
      '-i, --images <paths...>',
      'Reference image paths or URLs (1 or more)'
    )
    .option('--provider <name>', 'Provider to use')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen characters create --name "Worker" --images ./ref1.png ./ref2.png
  $ mediagen characters create --name "Logo" --images https://example.com/logo.png

Use the character ID with image generation:
  $ mediagen image generate --prompt "worker on site" --character <character-id>`
    )
    .action(async (opts) => {
      const config = loadConfig()
      const providerName = opts.provider ?? config.imageProvider
      const provider = getProvider(providerName, config)

      try {
        const character = await provider.createCharacter(opts.name, opts.images)

        if (opts.json) {
          out.json(character)
          return
        }

        out.success(`Character created: ${character.name} (${character.id})`)
        out.info(`Status: ${out.statusColor(character.status)}`)

        if (character.status !== 'completed') {
          out.info('Character is being processed. It will be ready shortly.')
        }
      } catch (err) {
        out.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  return characters
}
