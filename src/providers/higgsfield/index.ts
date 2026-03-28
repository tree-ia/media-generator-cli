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
  generateVideo,
  fetchStyles,
  fetchMotions,
  uploadImage,
  createSoulId,
  listSoulIds,
} from './client.js'
import {
  HIGGSFIELD_MODELS,
  DEFAULT_SIZE,
  DEFAULT_QUALITY,
  DEFAULT_VIDEO_MODEL,
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
    const jobSet = await generateImage(this.client, {
      prompt: opts.prompt,
      size: opts.size ?? DEFAULT_SIZE,
      quality: opts.quality ?? DEFAULT_QUALITY,
      styleId: opts.style,
      styleStrength: opts.styleStrength,
      characterId: opts.character,
      characterStrength: opts.characterStrength,
      seed: opts.seed,
      withPolling: !opts.noPoll,
    })

    const job = jobSet.jobs[0]
    const url = job?.results?.raw?.url

    return {
      requestId: jobSet.id,
      status: this.mapStatus(job?.status ?? 'queued'),
      url,
    }
  }

  async generateVideo(opts: VideoOptions): Promise<GenerationResult> {
    // If image is a local file, upload first
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
    const url = job?.results?.raw?.url

    return {
      requestId: jobSet.id,
      status: this.mapStatus(job?.status ?? 'queued'),
      url,
    }
  }

  async getStatus(requestId: string): Promise<StatusResult> {
    const { apiKey, apiSecret } = this.config.higgsfield
    if (!apiKey || !apiSecret) {
      throw new Error(
        'Higgsfield credentials required. Set HF_API_KEY and HF_API_SECRET.'
      )
    }

    const response = await fetch(
      `https://platform.higgsfield.ai/v1/job-sets/${requestId}`,
      {
        headers: {
          'hf-api-key': apiKey,
          'hf-secret': apiSecret,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      id: string
      jobs: Array<{ status: string; results?: { raw?: { url: string } } }>
    }
    const job = data.jobs[0]

    return {
      requestId: data.id,
      status: job?.status ?? 'unknown',
      url: job?.results?.raw?.url,
    }
  }

  async listModels(): Promise<Model[]> {
    return HIGGSFIELD_MODELS
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
