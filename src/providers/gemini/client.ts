import type { AppConfig } from '../../config.js'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export function getApiKey(config: AppConfig): string {
  const key = config.gemini.apiKey
  if (!key) {
    throw new Error(
      'Gemini API key not found.\n' +
        'Run: mediagen config set api-key YOUR_KEY --provider gemini\n' +
        'Get your key at: https://aistudio.google.com/apikey'
    )
  }
  return key
}

function headers(apiKey: string): Record<string, string> {
  return {
    'x-goog-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

export interface GeminiImagePart {
  inlineData: {
    mimeType: string
    data: string
  }
}

export type GeminiPart = GeminiImagePart | { text: string }

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: GeminiPart[]
    }
    finishReason?: string
  }>
  error?: {
    code: number
    message: string
    status: string
  }
}

export interface GenerateImageParams {
  model: string
  prompt: string
  aspectRatio?: string
  imageSize?: string
  images?: Array<{ mimeType: string; data: string }>
}

export async function generateImage(
  apiKey: string,
  params: GenerateImageParams
): Promise<GeminiResponse> {
  const hasImages = params.images && params.images.length > 0

  const parts: Array<Record<string, unknown>> = []
  if (hasImages) {
    for (const img of params.images!) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
    }
  }
  parts.push({ text: params.prompt })

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: hasImages ? ['TEXT', 'IMAGE'] : ['IMAGE'],
    },
  }

  const imageConfig: Record<string, string> = {}
  if (params.aspectRatio) imageConfig.aspectRatio = params.aspectRatio
  if (params.imageSize) imageConfig.imageSize = params.imageSize

  if (Object.keys(imageConfig).length > 0) {
    ;(body.generationConfig as Record<string, unknown>).imageConfig = imageConfig
  }

  const url = `${BASE_URL}/${params.model}:generateContent`

  const response = await fetch(url, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.error?.message || json.message || json.detail || text
    } catch {}
    throw new Error(`Gemini API error ${response.status}: ${detail}`)
  }

  return (await response.json()) as GeminiResponse
}

export function extractImageData(response: GeminiResponse): { mimeType: string; data: string } | null {
  if (!response.candidates?.length) return null

  for (const part of response.candidates[0].content.parts) {
    if ('inlineData' in part && part.inlineData) {
      return {
        mimeType: part.inlineData.mimeType,
        data: part.inlineData.data,
      }
    }
  }

  return null
}
