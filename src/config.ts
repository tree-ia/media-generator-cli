import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

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
  gemini: {
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
  gemini?: {
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
  if (update.gemini || current.gemini) {
    merged.gemini = { ...current.gemini, ...update.gemini }
  }

  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

export function removeProviderConfig(providerName: string): boolean {
  const current = readPersistedConfig()

  const key = providerName as keyof PersistedConfig
  if ((key === 'higgsfield' || key === 'freepik' || key === 'gemini') && current[key]) {
    delete current[key]
    writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2) + '\n', 'utf-8')
    return true
  }

  return false
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

export function loadConfig(): AppConfig {
  const persisted = readPersistedConfig()

  return {
    provider: persisted.provider ?? 'freepik',
    outputDir: persisted.outputDir ?? './output',
    higgsfield: {
      apiKey: persisted.higgsfield?.apiKey ?? '',
      apiSecret: persisted.higgsfield?.apiSecret ?? '',
    },
    freepik: {
      apiKey: persisted.freepik?.apiKey ?? '',
    },
    gemini: {
      apiKey: persisted.gemini?.apiKey ?? '',
    },
  }
}
