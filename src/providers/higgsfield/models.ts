import type { Model } from '../types.js'

export const HIGGSFIELD_MODELS: Model[] = [
  {
    id: 'soul',
    name: 'Soul',
    type: 'image',
    description: 'Higgsfield flagship text-to-image. High quality, configurable styles.',
  },
  {
    id: 'soul-2',
    name: 'Soul 2.0',
    type: 'image',
    description: 'Next-gen Soul with improved quality and coherence.',
  },
  {
    id: 'dop-lite',
    name: 'DoP Lite',
    type: 'video',
    description: 'Image-to-video, basic quality. Fastest generation.',
  },
  {
    id: 'dop-turbo',
    name: 'DoP Turbo',
    type: 'video',
    description: 'Image-to-video, 2x speed, priority queue.',
  },
  {
    id: 'dop-standard',
    name: 'DoP Standard',
    type: 'video',
    description: 'Image-to-video, highest quality, priority queue.',
  },
  {
    id: 'speak',
    name: 'Speak v2',
    type: 'speech',
    description: 'Speech-to-video (talking head generation).',
  },
]

export const SOUL_SIZES = [
  '2048x1152',
  '2048x1536',
  '2016x1344',
  '1696x960',
  '1632x1088',
  '1536x1536',
  '1536x1152',
  '1152x1536',
  '1152x2048',
  '1536x2048',
  '1344x2016',
  '960x1696',
  '1088x1632',
] as const

export const DEFAULT_SIZE = '1536x1536'
export const DEFAULT_QUALITY = '1080p'
export const DEFAULT_IMAGE_MODEL = 'soul'
export const DEFAULT_VIDEO_MODEL = 'dop-standard'
