import { Command } from 'commander'
import { loadConfig, writePersistedConfig, getConfigPath } from '../config.js'
import { listProviders } from '../providers/registry.js'
import * as out from '../utils/output.js'

function showConfig(asJson: boolean): void {
  const cfg = loadConfig()
  const mask = (val: string) => (val ? '***' + val.slice(-4) : 'not set')

  if (asJson) {
    out.json({
      provider: cfg.provider,
      outputDir: cfg.outputDir,
      configPath: getConfigPath(),
      higgsfield: {
        apiKey: mask(cfg.higgsfield.apiKey),
        apiSecret: mask(cfg.higgsfield.apiSecret),
      },
    })
    return
  }

  out.info(`Config file: ${getConfigPath()}`)
  out.info(`Provider: ${cfg.provider}`)
  out.info(`Output dir: ${cfg.outputDir}`)
  out.info(`Higgsfield API Key: ${mask(cfg.higgsfield.apiKey)}`)
  out.info(`Higgsfield API Secret: ${mask(cfg.higgsfield.apiSecret)}`)
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
  provider          Default provider (e.g. higgsfield)
  output-dir        Default output directory
  api-key           API key for the current provider
  api-secret        API secret for the current provider

Examples:
  $ mediagen config set api-key fpk_abc123
  $ mediagen config set api-secret sk_xyz789
  $ mediagen config set provider higgsfield
  $ mediagen config set output-dir ./public/assets

Config is saved to ~/.config/mediagen/config.json
Environment variables (HF_API_KEY, HF_API_SECRET) take priority over saved config.`
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
          }
          out.success(`API key saved for ${cfg.provider}`)
          break

        case 'api-secret':
          if (cfg.provider === 'higgsfield') {
            writePersistedConfig({ higgsfield: { apiSecret: value } })
          }
          out.success(`API secret saved for ${cfg.provider}`)
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
    .command('path')
    .description('Show the config file path')
    .action(() => {
      console.log(getConfigPath())
    })

  config
    .command('providers')
    .description('List available providers')
    .action(() => {
      const providers = listProviders()
      out.info('Available providers:')
      providers.forEach((p) => console.log(`  - ${p}`))
    })

  // Default: show config when no subcommand given
  config.action(() => showConfig(false))

  return config
}
