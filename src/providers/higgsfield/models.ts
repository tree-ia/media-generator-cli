import type { Model } from '../types.js'

export interface ModelConfig {
  id: string
  name: string
  type: 'image' | 'video' | 'speech'
  description: string
  endpoint: string
  inputType: 'text-to-image' | 'image-to-video' | 'edit'
}

export const HIGGSFIELD_MODELS: ModelConfig[] = [
  // Text-to-Image
  {
    id: 'soul',
    name: 'Soul Standard',
    type: 'image',
    endpoint: 'higgsfield-ai/soul/standard',
    inputType: 'text-to-image',
    description: 'Higgsfield flagship text-to-image. Good quality, fast.',
  },
  {
    id: 'reve',
    name: 'Reve',
    type: 'image',
    endpoint: 'reve/text-to-image',
    inputType: 'text-to-image',
    description: 'Versatile text-to-image generation.',
  },
  {
    id: 'seedream',
    name: 'Seedream v4',
    type: 'image',
    endpoint: 'bytedance/seedream/v4/text-to-image',
    inputType: 'text-to-image',
    description: 'ByteDance Seedream v4. Excellent for creative and artistic images.',
  },
  // Image-to-Video
  {
    id: 'dop-preview',
    name: 'DoP Preview',
    type: 'video',
    endpoint: 'higgsfield-ai/dop/preview',
    inputType: 'image-to-video',
    description: 'Image-to-video, preview quality. Fast generation.',
  },
  {
    id: 'dop-standard',
    name: 'DoP Standard',
    type: 'video',
    endpoint: 'higgsfield-ai/dop/standard',
    inputType: 'image-to-video',
    description: 'Image-to-video, highest quality.',
  },
  {
    id: 'seedance',
    name: 'Seedance v1 Pro',
    type: 'video',
    endpoint: 'bytedance/seedance/v1/pro/image-to-video',
    inputType: 'image-to-video',
    description: 'ByteDance Seedance. Professional-grade video generation.',
  },
  {
    id: 'kling',
    name: 'Kling 2.1 Pro',
    type: 'video',
    endpoint: 'kling-video/v2.1/pro/image-to-video',
    inputType: 'image-to-video',
    description: 'Kling Video 2.1 Pro. Advanced cinematic animations.',
  },
]

export function getModelConfig(id: string): ModelConfig | undefined {
  return HIGGSFIELD_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: ModelConfig): Model {
  return { id: m.id, name: m.name, type: m.type, description: m.description }
}

export const DEFAULT_IMAGE_MODEL = 'soul'
export const DEFAULT_VIDEO_MODEL = 'dop-standard'
