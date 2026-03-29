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
  getCredentials,
  createVideoTask,
  createImageTask,
  getImageTaskStatus,
  getVideoTaskStatus,
  pollVideoUntilDone,
  pollImageUntilDone,
  type KlingCredentials,
} from './client.js'
import {
  KLING_MODELS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  getKlingModel,
  toPublicModel,
} from './models.js'

export class KlingProvider implements Provider {
  name = 'kling'
  private config: AppConfig
  private _creds: KlingCredentials | null = null

  constructor(config: AppConfig) {
    this.config = config
  }

  private get creds(): KlingCredentials {
    if (!this._creds) {
      this._creds = getCredentials(this.config)
    }
    return this._creds
  }

  async generateImage(opts: ImageOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_IMAGE_MODEL
    const modelCfg = getKlingModel(modelId)

    if (!modelCfg || modelCfg.type !== 'image') {
      throw new Error(
        `Unknown Kling image model "${modelId}". Run "mediagen models --provider kling" to see available models.`
      )
    }

    const body: Record<string, unknown> = {
      model_name: modelCfg.modelName,
      prompt: opts.prompt,
    }

    if (opts.size) body.aspect_ratio = opts.size

    const task = await createImageTask(this.creds, body)

    if (opts.noPoll) {
      return {
        requestId: task.task_id,
        status: 'queued',
      }
    }

    const result = await pollImageUntilDone(this.creds, task.task_id)
    return {
      requestId: result.task_id,
      status: this.mapStatus(result.task_status),
      url: result.task_result?.images?.[0]?.url,
    }
  }

  async generateVideo(opts: VideoOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_VIDEO_MODEL
    const modelCfg = getKlingModel(modelId)

    if (!modelCfg || modelCfg.type !== 'video') {
      throw new Error(
        `Unknown Kling video model "${modelId}". Run "mediagen models --provider kling" to see available models.`
      )
    }

    const hasImage = !!opts.image
    const endpoint = hasImage ? 'image2video' : 'text2video'

    const body: Record<string, unknown> = {
      model_name: modelCfg.modelName,
      prompt: opts.prompt,
      mode: 'pro',
    }

    if (opts.duration) body.duration = String(opts.duration)
    if (opts.size) body.aspect_ratio = opts.size
    if (opts.negativePrompt) body.negative_prompt = opts.negativePrompt
    if (opts.seed !== undefined) body.seed = opts.seed

    // Handle image input for image-to-video
    if (hasImage) {
      if (opts.image!.startsWith('http')) {
        body.image = opts.image
      } else {
        const buffer = await readFile(opts.image!)
        const base64 = buffer.toString('base64')
        const mimeType = opts.image!.endsWith('.jpg') || opts.image!.endsWith('.jpeg')
          ? 'image/jpeg'
          : opts.image!.endsWith('.webp')
            ? 'image/webp'
            : 'image/png'
        body.image = `data:${mimeType};base64,${base64}`
      }
    }

    const task = await createVideoTask(this.creds, endpoint, body)

    if (opts.noPoll) {
      return {
        requestId: task.task_id,
        status: 'queued',
      }
    }

    const result = await pollVideoUntilDone(this.creds, endpoint, task.task_id)
    return {
      requestId: result.task_id,
      status: this.mapStatus(result.task_status),
      url: result.task_result?.videos?.[0]?.url,
    }
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    // Try image first, then video endpoints
    try {
      const result = await getImageTaskStatus(this.creds, requestId)
      return {
        requestId: result.task_id,
        status: result.task_status,
        url: result.task_result?.images?.[0]?.url,
      }
    } catch {
      // Not an image task, try video
    }

    // Try text2video endpoint
    try {
      const result = await getVideoTaskStatus(this.creds, 'text2video', requestId)
      return {
        requestId: result.task_id,
        status: result.task_status,
        url: result.task_result?.videos?.[0]?.url,
      }
    } catch {
      // Try image2video
    }

    const result = await getVideoTaskStatus(this.creds, 'image2video', requestId)
    return {
      requestId: result.task_id,
      status: result.task_status,
      url: result.task_result?.videos?.[0]?.url,
    }
  }

  async listModels(): Promise<Model[]> {
    return KLING_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    return []
  }

  async listMotions(): Promise<Motion[]> {
    return []
  }

  async upload(_filePath: string): Promise<string> {
    throw new Error('Kling does not support file uploads. Pass image URL or local path directly.')
  }

  async listCharacters(): Promise<Character[]> {
    return []
  }

  async createCharacter(_name: string, _imagePaths: string[]): Promise<Character> {
    throw new Error('Kling does not support characters.')
  }

  private mapStatus(
    status: string
  ): 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw' {
    const map: Record<string, GenerationResult['status']> = {
      submitted: 'queued',
      processing: 'in_progress',
      succeed: 'completed',
      failed: 'failed',
    }
    return map[status] ?? 'queued'
  }
}
