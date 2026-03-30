import type { AppConfig } from '../../config.js'
import { resolveToDataUri } from '../../utils/image.js'
import type {
  Provider,
  ImageOptions,
  VideoOptions,
  GenerationResult,
  StatusResult,
  Model,
  Style,
  Motion,
  Character,
} from '../types.js'
import {
  getApiKey,
  submitGeneration,
  pollUntilDone,
  getTaskStatus,
} from './client.js'
import {
  FREEPIK_MODELS,
  DEFAULT_IMAGE_MODEL,
  ASPECT_RATIOS,
  RUNWAY_RATIOS,
  getFreepikModel,
  toPublicModel,
} from './models.js'

export class FreepikProvider implements Provider {
  name = 'freepik'
  private config: AppConfig
  private _apiKey: string | null = null

  constructor(config: AppConfig) {
    this.config = config
  }

  private get apiKey(): string {
    if (!this._apiKey) {
      this._apiKey = getApiKey(this.config)
    }
    return this._apiKey
  }

  async generateImage(opts: ImageOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_IMAGE_MODEL
    const modelCfg = getFreepikModel(modelId)

    if (!modelCfg || modelCfg.type !== 'image') {
      throw new Error(
        `Unknown Freepik image model "${modelId}". Run "mediagen models" to see available models.`
      )
    }

    const body = this.buildImageBody(modelCfg.paramStyle, opts)

    if (modelCfg.supportsImageInput && opts.images?.length) {
      body.image_url = await resolveToDataUri(opts.images[0])
    }

    const task = await submitGeneration(this.apiKey, modelCfg.endpoint, body)

    if (opts.noPoll) {
      return {
        requestId: task.data.task_id,
        status: 'queued',
      }
    }

    const result = await pollUntilDone(
      this.apiKey,
      modelCfg.statusEndpoint,
      task.data.task_id
    )

    return {
      requestId: result.data.task_id,
      status: result.data.status === 'COMPLETED' ? 'completed' : 'failed',
      url: result.data.generated[0],
    }
  }

  async generateVideo(_opts: VideoOptions): Promise<GenerationResult> {
    throw new Error(
      'Video generation via Freepik is not supported.\n' +
        'Use --provider runway, kling, or higgsfield for video generation.'
    )
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    // Try each known status endpoint pattern
    const endpoints = [
      '/v1/ai/mystic',
      '/v1/ai/text-to-image/flux-2-pro',
      '/v1/ai/text-to-image/flux-2-klein',
      '/v1/ai/text-to-image/flux-kontext-pro',
      '/v1/ai/text-to-image/flux-pro-v1-1',
      '/v1/ai/text-to-image/flux-dev',
      '/v1/ai/text-to-image/hyperflux',
      '/v1/ai/text-to-image/seedream-v4-5',
      '/v1/ai/text-to-image/seedream-v4',
      '/v1/ai/text-to-image/runway',
    ]

    for (const endpoint of endpoints) {
      try {
        const result = await getTaskStatus(this.apiKey, endpoint, requestId)
        return {
          requestId: result.data.task_id,
          status: result.data.status.toLowerCase(),
          url: result.data.generated[0],
        }
      } catch {
        continue
      }
    }

    throw new Error(
      `Could not find task ${requestId}. The task may have expired or the model endpoint is unknown.`
    )
  }

  async listModels(): Promise<Model[]> {
    return FREEPIK_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    return [
      { id: 'zen', name: 'Zen', description: 'Mystic style: Zen' },
      { id: 'flexible', name: 'Flexible', description: 'Mystic style: Flexible' },
      { id: 'fluid', name: 'Fluid', description: 'Mystic style: Fluid' },
      { id: 'realism', name: 'Realism', description: 'Mystic style: Realism (default)' },
      { id: 'super_real', name: 'Super Real', description: 'Mystic style: Super Real' },
      { id: 'editorial_portraits', name: 'Editorial Portraits', description: 'Mystic style: Editorial Portraits' },
    ]
  }

  async listMotions(): Promise<Motion[]> {
    return []
  }

  async upload(_filePath: string): Promise<string> {
    throw new Error('Freepik does not support direct file uploads via API.')
  }

  async listCharacters(): Promise<Character[]> {
    return []
  }

  async createCharacter(_name: string, _imagePaths: string[]): Promise<Character> {
    throw new Error('Freepik does not support character creation.')
  }

  private buildImageBody(
    paramStyle: string,
    opts: ImageOptions
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      prompt: opts.prompt,
    }

    const aspectRatio = opts.size
      ? ASPECT_RATIOS[opts.size] ?? opts.size
      : undefined

    switch (paramStyle) {
      case 'mystic':
        if (aspectRatio) body.aspect_ratio = aspectRatio
        if (opts.quality) body.resolution = opts.quality.toLowerCase()
        if (opts.style) body.model = opts.style
        if (opts.seed !== undefined) body.fixed_generation = true
        break

      case 'flux-wh': {
        // Flux 2 Pro uses width/height
        const dims = this.aspectToPixels(opts.size ?? '1:1', 1024)
        body.width = dims.width
        body.height = dims.height
        if (opts.seed !== undefined) body.seed = opts.seed
        break
      }

      case 'flux-aspect':
        if (aspectRatio) body.aspect_ratio = aspectRatio
        if (opts.quality) body.resolution = opts.quality.toLowerCase()
        if (opts.seed !== undefined) body.seed = opts.seed
        break

      case 'seedream':
        if (aspectRatio) body.aspect_ratio = aspectRatio
        if (opts.seed !== undefined) body.seed = opts.seed
        break

      case 'runway':
        if (opts.size) {
          body.ratio = RUNWAY_RATIOS[opts.size] ?? '1024:1024'
        }
        if (opts.seed !== undefined) body.seed = opts.seed
        break
    }

    return body
  }

  private aspectToPixels(
    ratio: string,
    base: number
  ): { width: number; height: number } {
    const parts = ratio.split(':').map(Number)
    if (parts.length !== 2 || parts.some(isNaN)) {
      return { width: base, height: base }
    }
    const [w, h] = parts
    if (w > h) {
      return { width: Math.min(1440, base), height: Math.round((base * h) / w) }
    } else if (h > w) {
      return { width: Math.round((base * w) / h), height: Math.min(1440, base) }
    }
    return { width: base, height: base }
  }
}
