import type { Model } from '../types.js'

export interface ModelConfig {
  id: string
  name: string
  type: 'image' | 'video' | 'speech'
  description: string
  api: 'v1' | 'v2'
  endpoint: string
}

export const HIGGSFIELD_MODELS: ModelConfig[] = [
  // V2 models (slug format — recommended)
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    type: 'image',
    api: 'v2',
    endpoint: 'google/nano-banana-2/text-to-image',
    description: 'Fast text-to-image (Gemini-based). Supports 0.5K-4K, multiple aspect ratios.',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    type: 'image',
    api: 'v2',
    endpoint: 'google/nano-banana-pro/text-to-image',
    description: 'High-quality text-to-image (Gemini Pro). Best for detailed, realistic images.',
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    type: 'image',
    api: 'v2',
    endpoint: 'google/nano-banana/text-to-image',
    description: 'Original Nano Banana (Gemini Flash). Good balance of speed and quality.',
  },
  {
    id: 'flux-kontext',
    name: 'Flux Kontext Pro',
    type: 'image',
    api: 'v2',
    endpoint: 'flux-pro/kontext/max/text-to-image',
    description: 'Flux Kontext Max text-to-image. High coherence and detail.',
  },
  {
    id: 'seedream',
    name: 'Seedream v4',
    type: 'image',
    api: 'v2',
    endpoint: 'bytedance/seedream/v4/text-to-image',
    description: 'ByteDance Seedream v4. Excellent for creative and artistic images.',
  },
  // V1 models (legacy endpoints)
  {
    id: 'soul',
    name: 'Soul',
    type: 'image',
    api: 'v1',
    endpoint: '/v1/text2image/soul',
    description: 'Higgsfield flagship. Styles, characters, custom sizes.',
  },
  {
    id: 'dop-lite',
    name: 'DoP Lite',
    type: 'video',
    api: 'v1',
    endpoint: '/v1/image2video/dop',
    description: 'Image-to-video, basic quality. Fastest generation.',
  },
  {
    id: 'dop-turbo',
    name: 'DoP Turbo',
    type: 'video',
    api: 'v1',
    endpoint: '/v1/image2video/dop',
    description: 'Image-to-video, 2x speed, priority queue.',
  },
  {
    id: 'dop-standard',
    name: 'DoP Standard',
    type: 'video',
    api: 'v1',
    endpoint: '/v1/image2video/dop',
    description: 'Image-to-video, highest quality, priority queue.',
  },
]

export function getModelConfig(id: string): ModelConfig | undefined {
  return HIGGSFIELD_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: ModelConfig): Model {
  return { id: m.id, name: m.name, type: m.type, description: m.description }
}

export const NANO_BANANA_RESOLUTIONS = ['0.5K', '1K', '2K', '4K'] as const
export const NANO_BANANA_ASPECTS = [
  'auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9',
] as const

export const SOUL_SIZES = [
  '2048x1152', '2048x1536', '2016x1344', '1696x960', '1632x1088',
  '1536x1536', '1536x1152', '1152x1536', '1152x2048', '1536x2048',
  '1344x2016', '960x1696', '1088x1632',
] as const

export const DEFAULT_IMAGE_MODEL = 'nano-banana-2'
export const DEFAULT_VIDEO_MODEL = 'dop-standard'
