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
}

interface PersistedConfig {
  provider?: string
  outputDir?: string
  higgsfield?: {
    apiKey?: string
    apiSecret?: string
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
  const merged = {
    ...current,
    ...update,
    higgsfield: {
      ...current.higgsfield,
      ...update.higgsfield,
    },
  }

  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

// Priority: env vars > persisted config > defaults
export function loadConfig(): AppConfig {
  const persisted = readPersistedConfig()

  return {
    provider: process.env.MEDIAGEN_PROVIDER ?? persisted.provider ?? 'higgsfield',
    outputDir: process.env.MEDIAGEN_OUTPUT_DIR ?? persisted.outputDir ?? './output',
    higgsfield: {
      apiKey: process.env.HF_API_KEY ?? persisted.higgsfield?.apiKey ?? '',
      apiSecret: process.env.HF_API_SECRET ?? persisted.higgsfield?.apiSecret ?? '',
    },
  }
}
