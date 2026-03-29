import { createHmac } from 'crypto'
import type { AppConfig } from '../../config.js'

const BASE_URL = 'https://api.klingai.com/v1'

export interface KlingCredentials {
  accessKey: string
  secretKey: string
}

export function getCredentials(config: AppConfig): KlingCredentials {
  const { accessKey, secretKey } = config.kling

  if (!accessKey || !secretKey) {
    throw new Error(
      'Kling credentials not found.\n' +
        'Run: mediagen config set api-key YOUR_ACCESS_KEY --provider kling\n' +
        'Run: mediagen config set api-secret YOUR_SECRET_KEY --provider kling\n' +
        'Get your keys at: https://app.klingai.com/global/dev'
    )
  }

  return { accessKey, secretKey }
}

// --- JWT Generation (HS256, native crypto) ---

function base64url(data: string | Buffer): string {
  const b64 = typeof data === 'string'
    ? Buffer.from(data).toString('base64')
    : data.toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateJwt(creds: KlingCredentials): string {
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: creds.accessKey,
      exp: now + 1800,
      nbf: now - 5,
    })
  )

  const signature = base64url(
    createHmac('sha256', creds.secretKey)
      .update(`${header}.${payload}`)
      .digest()
  )

  return `${header}.${payload}.${signature}`
}

function authHeaders(creds: KlingCredentials): Record<string, string> {
  return {
    Authorization: `Bearer ${generateJwt(creds)}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// --- API Response Types ---

export interface KlingApiResponse<T> {
  code: number
  message: string
  request_id: string
  data: T
}

export interface KlingTaskData {
  task_id: string
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
  task_status_msg?: string
  task_result?: {
    videos?: Array<{ id: string; url: string; duration: string }>
    images?: Array<{ index: number; url: string }>
  }
  created_at: number
  updated_at: number
}

// --- Create Video Task ---

export async function createVideoTask(
  creds: KlingCredentials,
  endpoint: 'text2video' | 'image2video',
  body: Record<string, unknown>
): Promise<KlingTaskData> {
  const response = await fetch(`${BASE_URL}/videos/${endpoint}`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.message || json.error || text
    } catch {}
    throw new Error(`Kling API error ${response.status}: ${detail}`)
  }

  const json = (await response.json()) as KlingApiResponse<KlingTaskData>

  if (json.code !== 0) {
    throw new Error(`Kling API error ${json.code}: ${json.message}`)
  }

  return json.data
}

// --- Create Image Task ---

export async function createImageTask(
  creds: KlingCredentials,
  body: Record<string, unknown>
): Promise<KlingTaskData> {
  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.message || json.error || text
    } catch {}
    throw new Error(`Kling API error ${response.status}: ${detail}`)
  }

  const json = (await response.json()) as KlingApiResponse<KlingTaskData>

  if (json.code !== 0) {
    throw new Error(`Kling API error ${json.code}: ${json.message}`)
  }

  return json.data
}

// --- Get Task Status ---

export async function getVideoTaskStatus(
  creds: KlingCredentials,
  endpoint: 'text2video' | 'image2video',
  taskId: string
): Promise<KlingTaskData> {
  const response = await fetch(`${BASE_URL}/videos/${endpoint}/${taskId}`, {
    headers: authHeaders(creds),
  })

  if (!response.ok) {
    throw new Error(`Kling status check failed: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as KlingApiResponse<KlingTaskData>

  if (json.code !== 0) {
    throw new Error(`Kling API error ${json.code}: ${json.message}`)
  }

  return json.data
}

export async function getImageTaskStatus(
  creds: KlingCredentials,
  taskId: string
): Promise<KlingTaskData> {
  const response = await fetch(`${BASE_URL}/images/generations/${taskId}`, {
    headers: authHeaders(creds),
  })

  if (!response.ok) {
    throw new Error(`Kling status check failed: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as KlingApiResponse<KlingTaskData>

  if (json.code !== 0) {
    throw new Error(`Kling API error ${json.code}: ${json.message}`)
  }

  return json.data
}

// --- Poll Until Done ---

export async function pollVideoUntilDone(
  creds: KlingCredentials,
  endpoint: 'text2video' | 'image2video',
  taskId: string,
  intervalMs = 3000,
  maxMs = 600000
): Promise<KlingTaskData> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    const data = await getVideoTaskStatus(creds, endpoint, taskId)

    if (data.task_status === 'succeed' || data.task_status === 'failed') {
      return data
    }

    await sleep(intervalMs)
  }

  throw new Error(
    `Kling generation timed out after ${maxMs / 1000}s. Check status: mediagen status ${taskId}`
  )
}

export async function pollImageUntilDone(
  creds: KlingCredentials,
  taskId: string,
  intervalMs = 2000,
  maxMs = 300000
): Promise<KlingTaskData> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    const data = await getImageTaskStatus(creds, taskId)

    if (data.task_status === 'succeed' || data.task_status === 'failed') {
      return data
    }

    await sleep(intervalMs)
  }

  throw new Error(
    `Kling generation timed out after ${maxMs / 1000}s. Check status: mediagen status ${taskId}`
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
