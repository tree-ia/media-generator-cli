import type { AppConfig } from '../../config.js'

const BASE_URL = 'https://api.dev.runwayml.com/v1'
const API_VERSION = '2024-11-06'

export function getApiKey(config: AppConfig): string {
  const { apiKey } = config.runway

  if (!apiKey) {
    throw new Error(
      'Runway API key not found.\n' +
        'Run: mediagen config set provider runway\n' +
        'Run: mediagen config set api-key YOUR_KEY\n' +
        'Get your key at: https://dev.runwayml.com/'
    )
  }

  return apiKey
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Runway-Version': API_VERSION,
  }
}

// --- API Response Types ---

export interface TaskCreatedResponse {
  id: string
}

export interface TaskStatusResponse {
  id: string
  status: 'PENDING' | 'RUNNING' | 'THROTTLED' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'
  createdAt: string
  output?: string[]
  failure?: string
  failureCode?: string
}

// --- Create Image-to-Video / Text-to-Video Task ---

export async function createVideoTask(
  apiKey: string,
  body: Record<string, unknown>
): Promise<TaskCreatedResponse> {
  const response = await fetch(`${BASE_URL}/image_to_video`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.error || json.message || text
    } catch {}
    throw new Error(`Runway API error ${response.status}: ${detail}`)
  }

  return (await response.json()) as TaskCreatedResponse
}

// --- Create Text-to-Image Task ---

export async function createImageTask(
  apiKey: string,
  body: Record<string, unknown>
): Promise<TaskCreatedResponse> {
  const response = await fetch(`${BASE_URL}/text_to_image`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.error || json.message || text
    } catch {}
    throw new Error(`Runway API error ${response.status}: ${detail}`)
  }

  return (await response.json()) as TaskCreatedResponse
}

// --- Get Task Status ---

export async function getTaskStatus(
  apiKey: string,
  taskId: string
): Promise<TaskStatusResponse> {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    headers: authHeaders(apiKey),
  })

  if (!response.ok) {
    throw new Error(`Runway status check failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as TaskStatusResponse
}

// --- Poll Until Done ---

export async function pollUntilDone(
  apiKey: string,
  taskId: string,
  intervalMs = 3000,
  maxMs = 600000
): Promise<TaskStatusResponse> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    const data = await getTaskStatus(apiKey, taskId)

    if (data.status === 'SUCCEEDED' || data.status === 'FAILED' || data.status === 'CANCELED') {
      return data
    }

    // THROTTLED means auto-queued, treat as in-progress
    await sleep(intervalMs)
  }

  throw new Error(
    `Runway generation timed out after ${maxMs / 1000}s. Check status: mediagen status ${taskId}`
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
