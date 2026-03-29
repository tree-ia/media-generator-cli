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
    imageProvider: cfg.imageProvider,
    videoProvider: cfg.videoProvider,
    outputDir: cfg.outputDir,
    configPath: getConfigPath(),
    higgsfield: {
      apiKey: mask(cfg.higgsfield.apiKey),
      apiSecret: mask(cfg.higgsfield.apiSecret),
    },
    freepik: {
      apiKey: mask(cfg.freepik.apiKey),
    },
    gemini: {
      apiKey: mask(cfg.gemini.apiKey),
    },
    runway: {
      apiKey: mask(cfg.runway.apiKey),
    },
    kling: {
      accessKey: mask(cfg.kling.accessKey),
      secretKey: mask(cfg.kling.secretKey),
    },
  }

  if (asJson) {
    out.json(data)
    return
  }

  out.info(`Config file: ${getConfigPath()}`)
  out.info(`Image provider: ${cfg.imageProvider}`)
  out.info(`Video provider: ${cfg.videoProvider}`)
  out.info(`Output dir: ${cfg.outputDir}`)
  console.log('')
  out.info(`Higgsfield API Key: ${mask(cfg.higgsfield.apiKey)}`)
  out.info(`Higgsfield API Secret: ${mask(cfg.higgsfield.apiSecret)}`)
  console.log('')
  out.info(`Freepik API Key: ${mask(cfg.freepik.apiKey)}`)
  console.log('')
  out.info(`Gemini API Key: ${mask(cfg.gemini.apiKey)}`)
  console.log('')
  out.info(`Runway API Key: ${mask(cfg.runway.apiKey)}`)
  console.log('')
  out.info(`Kling Access Key: ${mask(cfg.kling.accessKey)}`)
  out.info(`Kling Secret Key: ${mask(cfg.kling.secretKey)}`)
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
    .option('--provider <name>', 'Provider context for api-key/api-secret')
    .addHelpText(
      'after',
      `
Available keys:
  image-provider    Default provider for image generation
  video-provider    Default provider for video generation
  output-dir        Default output directory
  api-key           API key (requires --provider <name>)
  api-secret        API secret (requires --provider <name>, Higgsfield/Kling only)

Examples:
  $ mediagen config set image-provider freepik
  $ mediagen config set video-provider runway
  $ mediagen config set api-key YOUR_KEY --provider gemini
  $ mediagen config set api-key YOUR_KEY --provider runway
  $ mediagen config set api-key YOUR_ACCESS_KEY --provider kling
  $ mediagen config set api-secret YOUR_SECRET --provider kling
  $ mediagen config set output-dir ./public/assets

Config is saved to ~/.config/mediagen/config.json`
    )
    .action((key: string, value: string, opts) => {
      const available = listProviders()

      switch (key) {
        case 'image-provider': {
          if (!available.includes(value)) {
            out.error(`Unknown provider "${value}". Available: ${available.join(', ')}`)
            process.exit(1)
          }
          writePersistedConfig({ imageProvider: value })
          out.success(`Image provider set to: ${value}`)
          break
        }

        case 'video-provider': {
          if (!available.includes(value)) {
            out.error(`Unknown provider "${value}". Available: ${available.join(', ')}`)
            process.exit(1)
          }
          writePersistedConfig({ videoProvider: value })
          out.success(`Video provider set to: ${value}`)
          break
        }

        case 'output-dir':
          writePersistedConfig({ outputDir: value })
          out.success(`Output directory set to: ${value}`)
          break

        case 'api-key': {
          const provider = opts.provider as string | undefined
          if (!provider) {
            out.error('--provider is required for api-key. Example: mediagen config set api-key YOUR_KEY --provider gemini')
            process.exit(1)
          }
          if (!available.includes(provider)) {
            out.error(`Unknown provider "${provider}". Available: ${available.join(', ')}`)
            process.exit(1)
          }
          if (provider === 'higgsfield') {
            writePersistedConfig({ higgsfield: { apiKey: value } })
          } else if (provider === 'freepik') {
            writePersistedConfig({ freepik: { apiKey: value } })
          } else if (provider === 'gemini') {
            writePersistedConfig({ gemini: { apiKey: value } })
          } else if (provider === 'runway') {
            writePersistedConfig({ runway: { apiKey: value } })
          } else if (provider === 'kling') {
            writePersistedConfig({ kling: { accessKey: value } })
          }
          out.success(`API key saved for ${provider}`)
          break
        }

        case 'api-secret': {
          const provider = opts.provider as string | undefined
          if (!provider) {
            out.error('--provider is required for api-secret. Example: mediagen config set api-secret YOUR_SECRET --provider kling')
            process.exit(1)
          }
          if (provider === 'higgsfield') {
            writePersistedConfig({ higgsfield: { apiSecret: value } })
          } else if (provider === 'kling') {
            writePersistedConfig({ kling: { secretKey: value } })
          } else {
            out.warn(`${provider} does not use an API secret.`)
          }
          break
        }

        default:
          out.error(
            `Unknown config key "${key}".\n` +
              'Available keys: image-provider, video-provider, output-dir, api-key, api-secret'
          )
          process.exit(1)
      }
    })

  config
    .command('remove')
    .description('Remove API credentials for a provider')
    .argument('<provider>', 'Provider to remove credentials for (freepik, higgsfield, gemini, runway, kling)')
    .addHelpText(
      'after',
      `
Examples:
  $ mediagen config remove freepik
  $ mediagen config remove higgsfield
  $ mediagen config remove runway
  $ mediagen config remove kling

This removes the stored API key (and secret) for the specified provider.`
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
        const tags: string[] = []
        if (p === cfg.imageProvider) tags.push('image')
        if (p === cfg.videoProvider) tags.push('video')
        const suffix = tags.length > 0 ? ` (${tags.join(', ')})` : ''
        console.log(`  - ${p}${suffix}`)
      })
    })

  // Default: show config when no subcommand given
  config.action(() => showConfig(false))

  return config
}
