import { config as dotenvConfig } from 'dotenv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'

dotenvConfig({ path: resolve(process.cwd(), '.env') })

const CONFIG_DIR = join(homedir(), '.config', 'mediagen')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export interface AppConfig {
  provider: string
  outputDir: string
  higgsfield: {
    apiKey: string
    apiSecret: string
  }
  freepik: {
    apiKey: string
  }
}

export interface PersistedConfig {
  provider?: string
  outputDir?: string
  higgsfield?: {
    apiKey?: string
    apiSecret?: string
  }
  freepik?: {
    apiKey?: string
  }
}

function readPersistedConfig(): PersistedConfig {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as PersistedConfig
  } catch {
    return {}
  }
}

export function writePersistedConfig(update: PersistedConfig): void {
  const current = readPersistedConfig()
  const merged: PersistedConfig = {
    ...current,
    ...update,
  }

  // Deep merge provider-specific configs
  if (update.higgsfield || current.higgsfield) {
    merged.higgsfield = { ...current.higgsfield, ...update.higgsfield }
  }
  if (update.freepik || current.freepik) {
    merged.freepik = { ...current.freepik, ...update.freepik }
  }

  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

export function removeProviderConfig(providerName: string): boolean {
  const current = readPersistedConfig()

  if (providerName === 'higgsfield' && current.higgsfield) {
    delete current.higgsfield
    writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2) + '\n', 'utf-8')
    return true
  }

  if (providerName === 'freepik' && current.freepik) {
    delete current.freepik
    writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2) + '\n', 'utf-8')
    return true
  }

  return false
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

// Priority: env vars > persisted config > defaults
export function loadConfig(): AppConfig {
  const persisted = readPersistedConfig()

  return {
    provider: process.env.MEDIAGEN_PROVIDER ?? persisted.provider ?? 'freepik',
    outputDir: process.env.MEDIAGEN_OUTPUT_DIR ?? persisted.outputDir ?? './output',
    higgsfield: {
      apiKey: process.env.HF_API_KEY ?? persisted.higgsfield?.apiKey ?? '',
      apiSecret: process.env.HF_API_SECRET ?? persisted.higgsfield?.apiSecret ?? '',
    },
    freepik: {
      apiKey: process.env.FREEPIK_API_KEY ?? persisted.freepik?.apiKey ?? '',
    },
  }
}
