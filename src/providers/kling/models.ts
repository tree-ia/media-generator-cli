import type { Model } from '../types.js'

export interface KlingModelConfig {
  id: string
  name: string
  type: 'image' | 'video'
  modelName: string
  inputType: 'text-to-video' | 'image-to-video' | 'text-to-image'
  supportsTextToVideo: boolean
  description: string
}

export const KLING_ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9',
]

export const KLING_MODELS: KlingModelConfig[] = [
  // Video models
  {
    id: 'kling-v2-master',
    name: 'Kling v2 Master',
    type: 'video',
    modelName: 'kling-v2-master',
    inputType: 'text-to-video',
    supportsTextToVideo: true,
    description: 'Kling v2 Master. High quality video generation.',
  },
  {
    id: 'kling-v2.1-master',
    name: 'Kling v2.1 Master',
    type: 'video',
    modelName: 'kling-v2-1-master',
    inputType: 'text-to-video',
    supportsTextToVideo: true,
    description: 'Kling v2.1 Master. Enhanced semantics and motion.',
  },
  {
    id: 'kling-v2.5-turbo',
    name: 'Kling v2.5 Turbo',
    type: 'video',
    modelName: 'kling-v2-5-turbo',
    inputType: 'text-to-video',
    supportsTextToVideo: true,
    description: 'Kling v2.5 Turbo. Fastest video generation.',
  },
  // Image models
  {
    id: 'kling-img-v2',
    name: 'Kling Image v2',
    type: 'image',
    modelName: 'kling-v2',
    inputType: 'text-to-image',
    supportsTextToVideo: false,
    description: 'Kling v2 image generation.',
  },
  {
    id: 'kling-img-v2.1',
    name: 'Kling Image v2.1',
    type: 'image',
    modelName: 'kling-v2-1',
    inputType: 'text-to-image',
    supportsTextToVideo: false,
    description: 'Kling v2.1 image generation. Latest quality.',
  },
]

export const DEFAULT_IMAGE_MODEL = 'kling-img-v2.1'
export const DEFAULT_VIDEO_MODEL = 'kling-v2.1-master'

export function getKlingModel(id: string): KlingModelConfig | undefined {
  return KLING_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: KlingModelConfig): Model {
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    description: m.description,
  }
}
