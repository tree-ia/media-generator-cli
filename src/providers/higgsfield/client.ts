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
import type { AppConfig } from '../../config.js'

export function createClient(config: AppConfig): HiggsfieldClient {
  const { apiKey, apiSecret } = config.higgsfield

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Higgsfield credentials not found.\n' +
        'Set HF_API_KEY and HF_API_SECRET env vars or create a .env file.\n' +
        'Get your keys at: https://cloud.higgsfield.ai/api-keys'
    )
  }

  return new HiggsfieldClient({ apiKey, apiSecret })
}

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
