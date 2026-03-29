import type { Model } from '../types.js'

export interface GeminiModelConfig {
  id: string
  name: string
  type: 'image'
  description: string
  model: string
  supportsImageSize: boolean
}

export const GEMINI_MODELS: GeminiModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    type: 'image',
    model: 'gemini-2.5-flash-image',
    supportsImageSize: false,
    description: 'Fast image generation. Free tier available. Aspect ratio only.',
  },
  {
    id: 'gemini-flash-preview',
    name: 'Gemini 3.1 Flash Preview',
    type: 'image',
    model: 'gemini-3.1-flash-image-preview',
    supportsImageSize: true,
    description: 'Latest Flash preview. Supports 2K/4K resolution.',
  },
  {
    id: 'gemini-pro-preview',
    name: 'Gemini 3 Pro Preview',
    type: 'image',
    model: 'gemini-3-pro-image-preview',
    supportsImageSize: true,
    description: 'Highest quality. Supports 2K/4K resolution. Slower.',
  },
]

export const ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3',
]

export const IMAGE_SIZES = ['1K', '2K', '4K']

export function getGeminiModel(id: string): GeminiModelConfig | undefined {
  return GEMINI_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: GeminiModelConfig): Model {
  return { id: m.id, name: m.name, type: m.type, description: m.description }
}

export const DEFAULT_IMAGE_MODEL = 'gemini-flash'
