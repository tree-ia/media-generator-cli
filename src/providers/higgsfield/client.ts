import {
  HiggsfieldClient,
  InputImage,
  type InputImageData,
  type JobSet,
  type SoulStyle,
  type Motion as HFMotion,
  type SoulId,
  type SoulIdListResponse,
} from '@higgsfield/client'
import {
  config as configV2,
  higgsfield as hfV2,
} from '@higgsfield/client/v2'
import type { AppConfig } from '../../config.js'

// --- V1 Client (Soul, DoP, styles, motions, characters) ---

export function createClient(config: AppConfig): HiggsfieldClient {
  const { apiKey, apiSecret } = config.higgsfield

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Higgsfield credentials not found.\n' +
        'Run: mediagen config set api-key YOUR_KEY\n' +
        'Run: mediagen config set api-secret YOUR_SECRET\n' +
        'Get your keys at: https://cloud.higgsfield.ai/api-keys'
    )
  }

  return new HiggsfieldClient({ apiKey, apiSecret })
}

// --- V2 Client (Nano Banana, Flux, Seedream — slug format) ---

let v2Configured = false

export function ensureV2(config: AppConfig): void {
  if (v2Configured) return
  const { apiKey, apiSecret } = config.higgsfield

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Higgsfield credentials not found.\n' +
        'Run: mediagen config set api-key YOUR_KEY\n' +
        'Run: mediagen config set api-secret YOUR_SECRET'
    )
  }

  configV2({ credentials: `${apiKey}:${apiSecret}` })
  v2Configured = true
}

export interface V2ImageParams {
  endpoint: string
  prompt: string
  resolution?: string
  aspectRatio?: string
  seed?: number
  withPolling: boolean
}

export interface V2Result {
  requestId: string
  status: string
  url?: string
}

export async function generateImageV2(
  config: AppConfig,
  params: V2ImageParams
): Promise<V2Result> {
  ensureV2(config)

  const input: Record<string, unknown> = {
    prompt: params.prompt,
  }

  if (params.resolution) input.resolution = params.resolution
  if (params.aspectRatio) input.aspect_ratio = params.aspectRatio
  if (params.seed !== undefined) input.seed = params.seed

  const result = await hfV2.subscribe(params.endpoint, {
    input,
    withPolling: params.withPolling,
  })

  const imageUrl = result.images?.[0]?.url

  return {
    requestId: result.request_id,
    status: result.status,
    url: imageUrl,
  }
}

// --- V1 Image Generation (Soul) ---

export interface GenerateImageParams {
  prompt: string
  size: string
  quality: string
  styleId?: string
  styleStrength?: number
  characterId?: string
  characterStrength?: number
  seed?: number
  withPolling: boolean
}

export async function generateImage(
  client: HiggsfieldClient,
  params: GenerateImageParams
): Promise<JobSet> {
  const input: Record<string, unknown> = {
    prompt: params.prompt,
    width_and_height: params.size,
    quality: params.quality,
    batch_size: 1,
  }

  if (params.styleId) {
    input.style_id = params.styleId
    if (params.styleStrength !== undefined) {
      input.style_strength = params.styleStrength
    }
  }

  if (params.characterId) {
    input.custom_reference_id = params.characterId
    if (params.characterStrength !== undefined) {
      input.custom_reference_strength = params.characterStrength
    }
  }

  if (params.seed !== undefined) {
    input.seed = params.seed
  }

  return client.generate('/v1/text2image/soul', input, {
    withPolling: params.withPolling,
  })
}

// --- V1 Video Generation (DoP) ---

export interface GenerateVideoParams {
  imageUrl: string
  prompt: string
  model: string
  motionId?: string
  motionStrength?: number
  seed?: number
  withPolling: boolean
}

export async function generateVideo(
  client: HiggsfieldClient,
  params: GenerateVideoParams
): Promise<JobSet> {
  const input: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    input_images: [InputImage.fromUrl(params.imageUrl)],
  }

  if (params.motionId) {
    input.motions = [
      { id: params.motionId, strength: params.motionStrength ?? 0.5 },
    ]
  }

  if (params.seed !== undefined) {
    input.seed = params.seed
  }

  return client.generate('/v1/image2video/dop', input, {
    withPolling: params.withPolling,
  })
}

// --- V1 Utilities ---

export async function fetchStyles(client: HiggsfieldClient): Promise<SoulStyle[]> {
  return client.getSoulStyles()
}

export async function fetchMotions(client: HiggsfieldClient): Promise<HFMotion[]> {
  return client.getMotions()
}

export async function uploadImage(
  client: HiggsfieldClient,
  imageBuffer: Buffer
): Promise<string> {
  return client.uploadImage(imageBuffer)
}

export async function createSoulId(
  client: HiggsfieldClient,
  name: string,
  imageUrls: string[]
): Promise<SoulId> {
  return client.createSoulId({
    name,
    input_images: imageUrls.map((url) => InputImage.fromUrl(url) as InputImageData),
  })
}

export async function listSoulIds(
  client: HiggsfieldClient
): Promise<SoulIdListResponse> {
  return client.listSoulIds()
}
