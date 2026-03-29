import { readFile } from 'fs/promises'
import type { AppConfig } from '../../config.js'
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
  createVideoTask,
  createImageTask,
  getTaskStatus,
  pollUntilDone,
} from './client.js'
import {
  RUNWAY_MODELS,
  RUNWAY_RATIOS,
  RUNWAY_IMAGE_RATIOS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  getRunwayModel,
  toPublicModel,
} from './models.js'

export class RunwayProvider implements Provider {
  name = 'runway'
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
    const modelCfg = getRunwayModel(modelId)

    if (!modelCfg || modelCfg.type !== 'image') {
      throw new Error(
        `Unknown Runway image model "${modelId}". Run "mediagen models --provider runway" to see available models.`
      )
    }

    const ratio = opts.size ? (RUNWAY_IMAGE_RATIOS[opts.size] ?? opts.size) : '1280:720'

    const body: Record<string, unknown> = {
      model: modelCfg.model,
      promptText: opts.prompt,
      ratio,
    }

    if (opts.seed !== undefined) body.seed = opts.seed

    const task = await createImageTask(this.apiKey, body)

    if (opts.noPoll) {
      return {
        requestId: task.id,
        status: 'queued',
      }
    }

    const result = await pollUntilDone(this.apiKey, task.id)
    return {
      requestId: result.id,
      status: this.mapStatus(result.status),
      url: result.output?.[0],
    }
  }

  async generateVideo(opts: VideoOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_VIDEO_MODEL
    const modelCfg = getRunwayModel(modelId)

    if (!modelCfg || modelCfg.type !== 'video') {
      throw new Error(
        `Unknown Runway video model "${modelId}". Run "mediagen models --provider runway" to see available models.`
      )
    }

    // Validate text-to-video support
    if (!opts.image && !modelCfg.supportsTextToVideo) {
      throw new Error(
        `Model "${modelId}" requires an input image. Use --image or choose gen4.5 for text-to-video.`
      )
    }

    const ratio = opts.size ? (RUNWAY_RATIOS[opts.size] ?? opts.size) : '1280:720'

    const body: Record<string, unknown> = {
      model: modelCfg.model,
      promptText: opts.prompt,
      ratio,
    }

    if (opts.duration) body.duration = opts.duration
    if (opts.seed !== undefined) body.seed = opts.seed

    // Handle image input
    if (opts.image) {
      if (opts.image.startsWith('http')) {
        body.promptImage = opts.image
      } else {
        const buffer = await readFile(opts.image)
        const base64 = buffer.toString('base64')
        const mimeType = opts.image.endsWith('.jpg') || opts.image.endsWith('.jpeg')
          ? 'image/jpeg'
          : opts.image.endsWith('.webp')
            ? 'image/webp'
            : 'image/png'
        body.promptImage = `data:${mimeType};base64,${base64}`
      }
    }

    const task = await createVideoTask(this.apiKey, body)

    if (opts.noPoll) {
      return {
        requestId: task.id,
        status: 'queued',
      }
    }

    const result = await pollUntilDone(this.apiKey, task.id)
    return {
      requestId: result.id,
      status: this.mapStatus(result.status),
      url: result.output?.[0],
    }
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    const result = await getTaskStatus(this.apiKey, requestId)
    return {
      requestId: result.id,
      status: result.status,
      url: result.output?.[0],
    }
  }

  async listModels(): Promise<Model[]> {
    return RUNWAY_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    return []
  }

  async listMotions(): Promise<Motion[]> {
    return []
  }

  async upload(_filePath: string): Promise<string> {
    throw new Error('Runway does not support file uploads. Pass image URL or local path directly.')
  }

  async listCharacters(): Promise<Character[]> {
    return []
  }

  async createCharacter(_name: string, _imagePaths: string[]): Promise<Character> {
    throw new Error('Runway does not support characters.')
  }

  private mapStatus(
    status: string
  ): 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw' {
    const map: Record<string, GenerationResult['status']> = {
      PENDING: 'queued',
      RUNNING: 'in_progress',
      THROTTLED: 'in_progress',
      SUCCEEDED: 'completed',
      FAILED: 'failed',
      CANCELED: 'failed',
    }
    return map[status] ?? 'queued'
  }
}
