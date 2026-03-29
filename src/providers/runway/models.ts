import type { Model } from '../types.js'

export interface RunwayModelConfig {
  id: string
  name: string
  type: 'image' | 'video'
  model: string
  inputType: 'text-to-video' | 'image-to-video' | 'text-to-image'
  supportsTextToVideo: boolean
  supportedRatios: string[]
  description: string
}

export const RUNWAY_RATIOS: Record<string, string> = {
  '16:9': '1280:720',
  '9:16': '720:1280',
  '1:1': '960:960',
  '4:3': '1104:832',
  '3:4': '832:1104',
  '21:9': '1584:672',
  '9:21': '672:1584',
}

export const RUNWAY_IMAGE_RATIOS: Record<string, string> = {
  ...RUNWAY_RATIOS,
  '16:9-hd': '1920:1080',
  '9:16-hd': '1080:1920',
}

export const RUNWAY_MODELS: RunwayModelConfig[] = [
  // Video models
  {
    id: 'gen3a-turbo',
    name: 'Gen-3 Alpha Turbo',
    type: 'video',
    model: 'gen3a_turbo',
    inputType: 'image-to-video',
    supportsTextToVideo: false,
    supportedRatios: ['16:9', '9:16'],
    description: 'Gen-3 Alpha Turbo. Fast video from image. 5 credits/sec.',
  },
  {
    id: 'gen4-turbo',
    name: 'Gen-4 Turbo',
    type: 'video',
    model: 'gen4_turbo',
    inputType: 'image-to-video',
    supportsTextToVideo: false,
    supportedRatios: ['16:9', '9:16', '21:9', '4:3', '3:4', '1:1'],
    description: 'Gen-4 Turbo. Best value video. 5 credits/sec.',
  },
  {
    id: 'gen4.5',
    name: 'Gen-4.5',
    type: 'video',
    model: 'gen4.5',
    inputType: 'image-to-video',
    supportsTextToVideo: true,
    supportedRatios: ['16:9', '9:16', '21:9', '4:3', '3:4', '1:1'],
    description: 'Gen-4.5. Highest quality. Text-to-video and image-to-video. 12 credits/sec.',
  },
  // Image models
  {
    id: 'gen4-image',
    name: 'Gen-4 Image',
    type: 'image',
    model: 'gen4_image',
    inputType: 'text-to-image',
    supportsTextToVideo: false,
    supportedRatios: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
    description: 'Gen-4 Image. High quality. 5-8 credits/image.',
  },
  {
    id: 'gen4-image-turbo',
    name: 'Gen-4 Image Turbo',
    type: 'image',
    model: 'gen4_image_turbo',
    inputType: 'text-to-image',
    supportsTextToVideo: false,
    supportedRatios: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
    description: 'Gen-4 Image Turbo. Fast generation. 2 credits/image.',
  },
]

export const DEFAULT_IMAGE_MODEL = 'gen4-image-turbo'
export const DEFAULT_VIDEO_MODEL = 'gen4-turbo'

export function getRunwayModel(id: string): RunwayModelConfig | undefined {
  return RUNWAY_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: RunwayModelConfig): Model {
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    description: m.description,
  }
}
