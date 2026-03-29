import { readFile } from 'fs/promises'
import { extname } from 'path'
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
  getCredentials,
  submitGeneration,
  pollUntilDone,
  getStatus,
  uploadImage,
  type HFCredentials,
} from './client.js'
import {
  HIGGSFIELD_MODELS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  getModelConfig,
  toPublicModel,
} from './models.js'

export class HiggsFieldProvider implements Provider {
  name = 'higgsfield'
  private config: AppConfig
  private _creds: HFCredentials | null = null

  constructor(config: AppConfig) {
    this.config = config
  }

  private get creds(): HFCredentials {
    if (!this._creds) {
      this._creds = getCredentials(this.config)
    }
    return this._creds
  }

  async generateImage(opts: ImageOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_IMAGE_MODEL
    const modelCfg = getModelConfig(modelId)

    if (!modelCfg || modelCfg.type !== 'image') {
      throw new Error(
        `Unknown image model "${modelId}". Run "mediagen models" to see available models.`
      )
    }

    const body: Record<string, unknown> = {
      prompt: opts.prompt,
    }

    if (opts.size) body.aspect_ratio = opts.size
    if (opts.quality) body.resolution = opts.quality
    if (opts.seed !== undefined) body.seed = opts.seed

    const queued = await submitGeneration(this.creds, modelCfg.endpoint, body)

    if (opts.noPoll) {
      return {
        requestId: queued.request_id,
        status: 'queued',
      }
    }

    const result = await pollUntilDone(this.creds, queued.request_id)
    return {
      requestId: result.request_id,
      status: this.mapStatus(result.status),
      url: result.images?.[0]?.url,
    }
  }

  async generateVideo(opts: VideoOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_VIDEO_MODEL
    const modelCfg = getModelConfig(modelId)

    if (!modelCfg || modelCfg.type !== 'video') {
      throw new Error(
        `Unknown video model "${modelId}". Run "mediagen models" to see available models.`
      )
    }

    if (!opts.image) {
      throw new Error('Higgsfield video requires an input image. Use --image <path-or-url>.')
    }

    // Upload local file if needed
    let imageUrl = opts.image
    if (!opts.image.startsWith('http')) {
      const buffer = await readFile(opts.image)
      const ext = extname(opts.image).toLowerCase()
      const contentType =
        ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/png'
      imageUrl = await uploadImage(this.creds, buffer, contentType)
    }

    const body: Record<string, unknown> = {
      image_url: imageUrl,
      prompt: opts.prompt,
    }

    if (opts.seed !== undefined) body.seed = opts.seed

    const queued = await submitGeneration(this.creds, modelCfg.endpoint, body)

    if (opts.noPoll) {
      return {
        requestId: queued.request_id,
        status: 'queued',
      }
    }

    const result = await pollUntilDone(this.creds, queued.request_id)
    return {
      requestId: result.request_id,
      status: this.mapStatus(result.status),
      url: result.video?.url,
    }
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    const result = await getStatus(this.creds, requestId)
    return {
      requestId: result.request_id,
      status: result.status,
      url: result.images?.[0]?.url ?? result.video?.url,
    }
  }

  async listModels(): Promise<Model[]> {
    return HIGGSFIELD_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    // Styles are Soul V1 specific — not available via REST API
    return []
  }

  async listMotions(): Promise<Motion[]> {
    // Motions are DoP V1 specific — not available via REST API
    return []
  }

  async upload(filePath: string): Promise<string> {
    const buffer = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/png'
    return uploadImage(this.creds, buffer, contentType)
  }

  async listCharacters(): Promise<Character[]> {
    // Characters (SoulId) are V1 specific — not available via REST API
    return []
  }

  async createCharacter(_name: string, _imagePaths: string[]): Promise<Character> {
    throw new Error(
      'Character creation requires the V1 SDK which is deprecated.\n' +
        'Use the Higgsfield web UI at cloud.higgsfield.ai instead.'
    )
  }

  private mapStatus(
    status: string
  ): 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw' {
    const map: Record<string, GenerationResult['status']> = {
      queued: 'queued',
      in_progress: 'in_progress',
      completed: 'completed',
      failed: 'failed',
      nsfw: 'nsfw',
    }
    return map[status] ?? 'queued'
  }
}
