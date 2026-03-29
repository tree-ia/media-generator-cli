import type { Provider } from './types.js'
import type { AppConfig } from '../config.js'
import { HiggsFieldProvider } from './higgsfield/index.js'
import { FreepikProvider } from './freepik/index.js'
import { GeminiProvider } from './gemini/index.js'

const providers = new Map<string, (config: AppConfig) => Provider>()

providers.set('higgsfield', (config) => new HiggsFieldProvider(config))
providers.set('freepik', (config) => new FreepikProvider(config))
providers.set('gemini', (config) => new GeminiProvider(config))

export function getProvider(name: string, config: AppConfig): Provider {
  const factory = providers.get(name)
  if (!factory) {
    const available = [...providers.keys()].join(', ')
    throw new Error(`Unknown provider "${name}". Available: ${available}`)
  }
  return factory(config)
}

export function listProviders(): string[] {
  return [...providers.keys()]
}
