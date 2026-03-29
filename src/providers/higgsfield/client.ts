import type { AppConfig } from '../../config.js'

const BASE_URL = 'https://platform.higgsfield.ai'

export interface HFCredentials {
  apiKey: string
  apiSecret: string
}

export function getCredentials(config: AppConfig): HFCredentials {
  const { apiKey, apiSecret } = config.higgsfield

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Higgsfield credentials not found.\n' +
        'Run: mediagen config set api-key YOUR_KEY --provider higgsfield\n' +
        'Run: mediagen config set api-secret YOUR_SECRET --provider higgsfield\n' +
        'Get your keys at: https://cloud.higgsfield.ai/api-keys'
    )
  }

  return { apiKey, apiSecret }
}

function authHeaders(creds: HFCredentials): Record<string, string> {
  return {
    Authorization: `Key ${creds.apiKey}:${creds.apiSecret}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// --- API Response Types ---

export interface QueuedResponse {
  status: 'queued'
  request_id: string
  status_url: string
  cancel_url: string
}

export interface CompletedResponse {
  status: 'completed'
  request_id: string
  status_url: string
  cancel_url: string
  images?: Array<{ url: string }>
  video?: { url: string }
}

export interface StatusResponse {
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw'
  request_id: string
  status_url?: string
  cancel_url?: string
  images?: Array<{ url: string }>
  video?: { url: string }
  error?: string
}

// --- Submit Generation ---

export async function submitGeneration(
  creds: HFCredentials,
  modelEndpoint: string,
  body: Record<string, unknown>
): Promise<QueuedResponse> {
  const response = await fetch(`${BASE_URL}/${modelEndpoint}`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.detail || json.error || json.message || text
    } catch {}
    throw new Error(`API error ${response.status}: ${detail}`)
  }

  return (await response.json()) as QueuedResponse
}

// --- Poll for Status ---

export async function pollUntilDone(
  creds: HFCredentials,
  requestId: string,
  intervalMs = 2000,
  maxMs = 300000
): Promise<StatusResponse> {
  const start = Date.now()
  const statusUrl = `${BASE_URL}/requests/${requestId}/status`

  while (Date.now() - start < maxMs) {
    const response = await fetch(statusUrl, {
      headers: authHeaders(creds),
    })

    if (!response.ok) {
      if (response.status >= 500) {
        await sleep(intervalMs)
        continue
      }
      throw new Error(`Status check failed: ${response.status}`)
    }

    const data = (await response.json()) as StatusResponse

    if (data.status === 'completed' || data.status === 'failed' || data.status === 'nsfw') {
      return data
    }

    await sleep(intervalMs)
  }

  throw new Error(`Generation timed out after ${maxMs / 1000}s. Check status: mediagen status ${requestId}`)
}

// --- Get Status (single check) ---

export async function getStatus(
  creds: HFCredentials,
  requestId: string
): Promise<StatusResponse> {
  const response = await fetch(`${BASE_URL}/requests/${requestId}/status`, {
    headers: authHeaders(creds),
  })

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as StatusResponse
}

// --- Upload Image ---

export async function uploadImage(
  creds: HFCredentials,
  imageBuffer: Buffer,
  contentType = 'image/png'
): Promise<string> {
  // Step 1: Get upload URL
  const genResponse = await fetch(`${BASE_URL}/files/generate-upload-url`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ content_type: contentType }),
  })

  if (!genResponse.ok) {
    throw new Error(`Failed to get upload URL: ${genResponse.status}`)
  }

  const { upload_url, public_url } = (await genResponse.json()) as {
    upload_url: string
    public_url: string
  }

  // Step 2: Upload to CDN
  const putResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(imageBuffer),
  })

  if (!putResponse.ok) {
    throw new Error(`Upload failed: ${putResponse.status}`)
  }

  return public_url
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
