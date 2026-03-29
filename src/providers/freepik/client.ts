import type { AppConfig } from '../../config.js'

const BASE_URL = 'https://api.freepik.com'

export function getApiKey(config: AppConfig): string {
  const key = config.freepik.apiKey
  if (!key) {
    throw new Error(
      'Freepik API key not found.\n' +
        'Run: mediagen config set api-key YOUR_KEY --provider freepik\n' +
        'Get your key at: https://www.freepik.com/api'
    )
  }
  return key
}

function headers(apiKey: string): Record<string, string> {
  return {
    'x-freepik-api-key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// --- Task Response Types ---

export interface TaskResponse {
  data: {
    task_id: string
    status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    generated: string[]
    has_nsfw?: boolean[]
  }
}

// --- Submit Generation ---

export async function submitGeneration(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.message || json.detail || json.error || text
    } catch {}
    throw new Error(`Freepik API error ${response.status}: ${detail}`)
  }

  return (await response.json()) as TaskResponse
}

// --- Poll for Status ---

export async function pollUntilDone(
  apiKey: string,
  statusEndpoint: string,
  taskId: string,
  intervalMs = 2000,
  maxMs = 300000
): Promise<TaskResponse> {
  const start = Date.now()
  const url = `${BASE_URL}${statusEndpoint}/${taskId}`

  while (Date.now() - start < maxMs) {
    const response = await fetch(url, {
      headers: headers(apiKey),
    })

    if (!response.ok) {
      if (response.status >= 500) {
        await sleep(intervalMs)
        continue
      }
      throw new Error(`Status check failed: ${response.status}`)
    }

    const data = (await response.json()) as TaskResponse

    if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
      return data
    }

    await sleep(intervalMs)
  }

  throw new Error(
    `Generation timed out after ${maxMs / 1000}s. Check status: mediagen status ${taskId}`
  )
}

// --- Get Status (single check) ---

export async function getTaskStatus(
  apiKey: string,
  statusEndpoint: string,
  taskId: string
): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}${statusEndpoint}/${taskId}`, {
    headers: headers(apiKey),
  })

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as TaskResponse
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
