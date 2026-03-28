import type { Model } from '../types.js'

export interface FreepikModelConfig {
  id: string
  name: string
  type: 'image' | 'video' | 'audio'
  description: string
  endpoint: string
  statusEndpoint: string
  paramStyle: 'mystic' | 'flux-wh' | 'flux-aspect' | 'seedream' | 'runway'
}

export const FREEPIK_MODELS: FreepikModelConfig[] = [
  // Text-to-Image
  {
    id: 'mystic',
    name: 'Mystic',
    type: 'image',
    endpoint: '/v1/ai/mystic',
    statusEndpoint: '/v1/ai/mystic',
    paramStyle: 'mystic',
    description: 'Freepik flagship. Hyper-realistic, 2K-4K, styles & engines.',
  },
  {
    id: 'flux-2-pro',
    name: 'Flux 2 Pro',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/flux-2-pro',
    statusEndpoint: '/v1/ai/text-to-image/flux-2-pro',
    paramStyle: 'flux-wh',
    description: 'High quality Flux model. Custom width/height (256-1440px).',
  },
  {
    id: 'flux-2-klein',
    name: 'Flux 2 Klein',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/flux-2-klein',
    statusEndpoint: '/v1/ai/text-to-image/flux-2-klein',
    paramStyle: 'flux-aspect',
    description: 'Sub-second generation. Fastest Flux model.',
  },
  {
    id: 'flux-kontext',
    name: 'Flux Kontext Pro',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/flux-kontext-pro',
    statusEndpoint: '/v1/ai/text-to-image/flux-kontext-pro',
    paramStyle: 'flux-aspect',
    description: 'Context-aware generation with optional image input.',
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro 1.1',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/flux-pro-v1-1',
    statusEndpoint: '/v1/ai/text-to-image/flux-pro-v1-1',
    paramStyle: 'flux-aspect',
    description: 'Flux Pro v1.1. Great detail and coherence.',
  },
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/flux-dev',
    statusEndpoint: '/v1/ai/text-to-image/flux-dev',
    paramStyle: 'flux-aspect',
    description: 'Flux Dev. Supports color/framing/lighting effects.',
  },
  {
    id: 'hyperflux',
    name: 'HyperFlux',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/hyperflux',
    statusEndpoint: '/v1/ai/text-to-image/hyperflux',
    paramStyle: 'flux-aspect',
    description: 'Ultra-fast generation. Supports effects styling.',
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/seedream-v4-5',
    statusEndpoint: '/v1/ai/text-to-image/seedream-v4-5',
    paramStyle: 'seedream',
    description: 'ByteDance Seedream 4.5. Creative, supports cinematic 21:9.',
  },
  {
    id: 'seedream-4',
    name: 'Seedream 4',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/seedream-v4',
    statusEndpoint: '/v1/ai/text-to-image/seedream-v4',
    paramStyle: 'seedream',
    description: 'ByteDance Seedream v4. Artistic image generation.',
  },
  {
    id: 'runway',
    name: 'RunWay',
    type: 'image',
    endpoint: '/v1/ai/text-to-image/runway',
    statusEndpoint: '/v1/ai/text-to-image/runway',
    paramStyle: 'runway',
    description: 'RunWay text-to-image. Pixel ratio format.',
  },
]

// Aspect ratio mapping (named → Freepik enum)
export const ASPECT_RATIOS: Record<string, string> = {
  '1:1': 'square_1_1',
  '4:3': 'classic_4_3',
  '3:4': 'traditional_3_4',
  '16:9': 'widescreen_16_9',
  '9:16': 'social_story_9_16',
  '3:2': 'standard_3_2',
  '2:3': 'portrait_2_3',
  '2:1': 'horizontal_2_1',
  '1:2': 'vertical_1_2',
  '5:4': 'social_5_4',
  '4:5': 'social_post_4_5',
  '21:9': 'cinematic_21_9',
}

// RunWay uses pixel ratios
export const RUNWAY_RATIOS: Record<string, string> = {
  '16:9': '1920:1080',
  '9:16': '1080:1920',
  '1:1': '1024:1024',
  '4:3': '1440:1080',
  '3:4': '1080:1440',
}

export function getFreepikModel(id: string): FreepikModelConfig | undefined {
  return FREEPIK_MODELS.find((m) => m.id === id)
}

export function toPublicModel(m: FreepikModelConfig): Model {
  return { id: m.id, name: m.name, type: m.type, description: m.description }
}

export const DEFAULT_IMAGE_MODEL = 'mystic'
