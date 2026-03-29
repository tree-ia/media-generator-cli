import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { randomUUID } from 'crypto'
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
import { getApiKey, generateImage, extractImageData } from './client.js'
import {
  GEMINI_MODELS,
  DEFAULT_IMAGE_MODEL,
  getGeminiModel,
  toPublicModel,
} from './models.js'

export class GeminiProvider implements Provider {
  name = 'gemini'
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
    const modelCfg = getGeminiModel(modelId)

    if (!modelCfg) {
      throw new Error(
        `Unknown Gemini image model "${modelId}". Run "mediagen models" to see available models.`
      )
    }

    const aspectRatio = opts.size ?? undefined
    const imageSize = modelCfg.supportsImageSize ? this.mapQualityToSize(opts.quality) : undefined

    const response = await generateImage(this.apiKey, {
      model: modelCfg.model,
      prompt: opts.prompt,
      aspectRatio,
      imageSize,
    })

    const imageData = extractImageData(response)

    if (!imageData) {
      return {
        requestId: randomUUID(),
        status: 'failed',
      }
    }

    // Gemini returns base64 data directly — save to a temp file and return path
    const ext = imageData.mimeType === 'image/jpeg' ? '.jpg' : '.png'
    const tempDir = opts.output ? dirname(opts.output) : '/tmp'
    const tempPath = opts.output ?? `${tempDir}/gemini-${randomUUID()}${ext}`

    await mkdir(dirname(tempPath), { recursive: true })
    const buffer = Buffer.from(imageData.data, 'base64')
    await writeFile(tempPath, buffer)

    return {
      requestId: randomUUID(),
      status: 'completed',
      localPath: tempPath,
    }
  }

  async generateVideo(_opts: VideoOptions): Promise<GenerationResult> {
    throw new Error(
      'Video generation via Gemini is not supported.\n' +
        'Use --provider higgsfield for video generation.'
    )
  }

  async getStatus(_requestId: string): Promise<StatusResult> {
    throw new Error(
      'Gemini generates images synchronously — no status polling needed.'
    )
  }

  async listModels(): Promise<Model[]> {
    return GEMINI_MODELS.map(toPublicModel)
  }

  async listStyles(): Promise<Style[]> {
    return []
  }

  async listMotions(): Promise<Motion[]> {
    return []
  }

  async upload(_filePath: string): Promise<string> {
    throw new Error('Gemini does not support direct file uploads via this CLI.')
  }

  async listCharacters(): Promise<Character[]> {
    return []
  }

  async createCharacter(_name: string, _imagePaths: string[]): Promise<Character> {
    throw new Error('Gemini does not support character creation.')
  }

  private mapQualityToSize(quality?: string): string | undefined {
    if (!quality) return undefined
    const map: Record<string, string> = {
      '1k': '1K',
      '2k': '2K',
      '4k': '4K',
      '1080p': '1K',
    }
    return map[quality.toLowerCase()] ?? quality.toUpperCase()
  }
}
