import { Command } from 'commander'
import {
  loadConfig,
  writePersistedConfig,
  removeProviderConfig,
  getConfigPath,
} from '../config.js'
import { listProviders } from '../providers/registry.js'
import * as out from '../utils/output.js'

function showConfig(asJson: boolean): void {
  const cfg = loadConfig()
  const mask = (val: string) => (val ? '***' + val.slice(-4) : 'not set')

  const data = {
    provider: cfg.provider,
    outputDir: cfg.outputDir,
    configPath: getConfigPath(),
    higgsfield: {
      apiKey: mask(cfg.higgsfield.apiKey),
      apiSecret: mask(cfg.higgsfield.apiSecret),
    },
    freepik: {
      apiKey: mask(cfg.freepik.apiKey),
    },
  }

  if (asJson) {
    out.json(data)
    return
  }

  out.info(`Config file: ${getConfigPath()}`)
  out.info(`Provider: ${cfg.provider}`)
  out.info(`Output dir: ${cfg.outputDir}`)
  console.log('')
  out.info(`Higgsfield API Key: ${mask(cfg.higgsfield.apiKey)}`)
  out.info(`Higgsfield API Secret: ${mask(cfg.higgsfield.apiSecret)}`)
  console.log('')
  out.info(`Freepik API Key: ${mask(cfg.freepik.apiKey)}`)
}

export function createConfigCommand(): Command {
  const config = new Command('config').description('View and manage CLI configuration')

  config
    .command('show')
    .description('Show current configuration')
    .option('--json', 'Output as JSON')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen config show
  $ mediagen config show --json`
    )
    .action((opts) => showConfig(opts.json))

  config
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Config key to set')
    .argument('<value>', 'Value to set')
    .addHelpText(
      'after',
      `
Available keys:
  provider          Default provider (freepik, higgsfield)
  output-dir        Default output directory
  api-key           API key for the current provider
  api-secret        API secret (Higgsfield only)

Examples:
  $ mediagen config set provider freepik
  $ mediagen config set api-key fpk_abc123
  $ mediagen config set provider higgsfield
  $ mediagen config set api-key hf_key_here
  $ mediagen config set api-secret hf_secret_here
  $ mediagen config set output-dir ./public/assets

Config is saved to ~/.config/mediagen/config.json
Environment variables take priority over saved config.`
    )
    .action((key: string, value: string) => {
      const cfg = loadConfig()

      switch (key) {
        case 'provider': {
          const available = listProviders()
          if (!available.includes(value)) {
            out.error(`Unknown provider "${value}". Available: ${available.join(', ')}`)
            process.exit(1)
          }
          writePersistedConfig({ provider: value })
          out.success(`Provider set to: ${value}`)
          break
        }

        case 'output-dir':
          writePersistedConfig({ outputDir: value })
          out.success(`Output directory set to: ${value}`)
          break

        case 'api-key':
          if (cfg.provider === 'higgsfield') {
            writePersistedConfig({ higgsfield: { apiKey: value } })
          } else if (cfg.provider === 'freepik') {
            writePersistedConfig({ freepik: { apiKey: value } })
          }
          out.success(`API key saved for ${cfg.provider}`)
          break

        case 'api-secret':
          if (cfg.provider === 'higgsfield') {
            writePersistedConfig({ higgsfield: { apiSecret: value } })
          } else {
            out.warn(`${cfg.provider} does not use an API secret.`)
          }
          break

        default:
          out.error(
            `Unknown config key "${key}".\n` +
              'Available keys: provider, output-dir, api-key, api-secret'
          )
          process.exit(1)
      }
    })

  config
    .command('remove')
    .description('Remove API credentials for a provider')
    .argument('<provider>', 'Provider to remove credentials for (freepik, higgsfield)')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen config remove freepik
  $ mediagen config remove higgsfield

This removes the stored API key (and secret) for the specified provider.
Environment variables are not affected.`
    )
    .action((provider: string) => {
      const available = listProviders()
      if (!available.includes(provider)) {
        out.error(`Unknown provider "${provider}". Available: ${available.join(', ')}`)
        process.exit(1)
      }

      const removed = removeProviderConfig(provider)
      if (removed) {
        out.success(`Credentials removed for ${provider}`)
      } else {
        out.warn(`No credentials found for ${provider}`)
      }
    })

  config
    .command('path')
    .description('Show the config file path')
    .action(() => {
      console.log(getConfigPath())
    })

  config
    .command('providers')
    .description('List available providers')
    .action(() => {
      const cfg = loadConfig()
      const providers = listProviders()
      out.info('Available providers:')
      providers.forEach((p) => {
        const active = p === cfg.provider ? ' (active)' : ''
        console.log(`  - ${p}${active}`)
      })
    })

  // Default: show config when no subcommand given
  config.action(() => showConfig(false))

  return config
}
