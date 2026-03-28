import { readFile } from 'fs/promises'
import type { HiggsfieldClient } from '@higgsfield/client'
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
  createClient,
  generateImage,
  generateImageV2,
  generateVideo,
  fetchStyles,
  fetchMotions,
  uploadImage,
  createSoulId,
  listSoulIds,
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
  private _client: HiggsfieldClient | null = null
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  private get client(): HiggsfieldClient {
    if (!this._client) {
      this._client = createClient(this.config)
    }
    return this._client
  }

  async generateImage(opts: ImageOptions): Promise<GenerationResult> {
    const modelId = opts.model ?? DEFAULT_IMAGE_MODEL
    const modelCfg = getModelConfig(modelId)

    if (!modelCfg) {
      throw new Error(
        `Unknown model "${modelId}". Run "mediagen models" to see available models.`
      )
    }

    // V2 models (Nano Banana, Flux, Seedream)
    if (modelCfg.api === 'v2') {
      const result = await generateImageV2(this.config, {
        endpoint: modelCfg.endpoint,
        prompt: opts.prompt,
        resolution: opts.quality ?? '2K',
        aspectRatio: opts.size ?? '1:1',
        seed: opts.seed,
        withPolling: !opts.noPoll,
      })

      return {
        requestId: result.requestId,
        status: this.mapStatus(result.status),
        url: result.url,
      }
    }

    // V1 models (Soul)
    const jobSet = await generateImage(this.client, {
      prompt: opts.prompt,
      size: opts.size ?? '1536x1536',
      quality: opts.quality ?? '1080p',
      styleId: opts.style,
      styleStrength: opts.styleStrength,
      characterId: opts.character,
      characterStrength: opts.characterStrength,
      seed: opts.seed,
      withPolling: !opts.noPoll,
    })

    const job = jobSet.jobs[0]
    return {
      requestId: jobSet.id,
      status: this.mapStatus(job?.status ?? 'queued'),
      url: job?.results?.raw?.url,
    }
  }

  async generateVideo(opts: VideoOptions): Promise<GenerationResult> {
    let imageUrl = opts.image
    if (!opts.image.startsWith('http')) {
      const buffer = await readFile(opts.image)
      imageUrl = await uploadImage(this.client, buffer)
    }

    const jobSet = await generateVideo(this.client, {
      imageUrl,
      prompt: opts.prompt,
      model: opts.model ?? DEFAULT_VIDEO_MODEL,
      motionId: opts.motion,
      motionStrength: opts.motionStrength,
      seed: opts.seed,
      withPolling: !opts.noPoll,
    })

    const job = jobSet.jobs[0]
    return {
      requestId: jobSet.id,
      status: this.mapStatus(job?.status ?? 'queued'),
      url: job?.results?.raw?.url,
    }
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    const { apiKey, apiSecret } = this.config.higgsfield
    if (!apiKey || !apiSecret) {
      throw new Error(
        'Higgsfield credentials required. Set HF_API_KEY and HF_API_SECRET.'
      )
    }

    // Try V2 status first, fallback to V1
    const endpoints = [
      `https://platform.higgsfield.ai/requests/${requestId}/status`,
      `https://platform.higgsfield.ai/v1/job-sets/${requestId}`,
    ]

    for (const url of endpoints) {
      const response = await fetch(url, {
        headers: {
          'hf-api-key': apiKey,
          'hf-secret': apiSecret,
          Authorization: `Key ${apiKey}:${apiSecret}`,
        },
      })

      if (!response.ok) continue

      const data = (await response.json()) as Record<string, unknown>

      // V2 format
      if (data.request_id) {
        return {
          requestId: data.request_id as string,
          status: (data.status as string) ?? 'unknown',
          url: ((data.images as Array<{ url: string }>) ?? [])[0]?.url
            ?? (data.video as { url: string })?.url,
        }
      }

      // V1 format
      if (data.jobs) {
        const job = (data.jobs as Array<{ status: string; results?: { raw?: { url: string } } }>)[0]
        return {
          requestId: data.id as string,
          status: job?.status ?? 'unknown',
          url: job?.results?.raw?.url,
        }
      }
    }

    throw new Error(`Failed to get status for request: ${requestId}`)
  }

  async listModels(): Promise<Model[]> {
    return HIGGSFIELD_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    const styles = await fetchStyles(this.client)
    return styles.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      previewUrl: s.preview_url,
    }))
  }

  async listMotions(): Promise<Motion[]> {
    const motions = await fetchMotions(this.client)
    return motions.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      previewUrl: m.preview_url,
    }))
  }

  async upload(filePath: string): Promise<string> {
    const buffer = await readFile(filePath)
    return uploadImage(this.client, buffer)
  }

  async listCharacters(): Promise<Character[]> {
    const result = await listSoulIds(this.client)
    return result.items.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
    }))
  }

  async createCharacter(name: string, imagePaths: string[]): Promise<Character> {
    const urls: string[] = []
    for (const path of imagePaths) {
      if (path.startsWith('http')) {
        urls.push(path)
      } else {
        const buffer = await readFile(path)
        const url = await uploadImage(this.client, buffer)
        urls.push(url)
      }
    }

    const soulId = await createSoulId(this.client, name, urls)
    return {
      id: soulId.id,
      name: soulId.name,
      status: soulId.status,
    }
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
      canceled: 'failed',
    }
    return map[status] ?? 'queued'
  }
}
