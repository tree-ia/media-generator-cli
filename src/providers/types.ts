export interface ImageOptions {
  prompt: string
  images?: string[]
  model?: string
  size?: string
  quality?: string
  output?: string
  style?: string
  styleStrength?: number
  character?: string
  characterStrength?: number
  seed?: number
  noPoll?: boolean
}

export interface VideoOptions {
  image?: string
  images?: string[]
  prompt: string
  model?: string
  size?: string
  duration?: number
  negativePrompt?: string
  motion?: string
  motionStrength?: number
  output?: string
  seed?: number
  noPoll?: boolean
}

export interface GenerationResult {
  requestId: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw'
  url?: string
  localPath?: string
}

export interface StatusResult {
  requestId: string
  status: string
  url?: string
}

export interface Model {
  id: string
  name: string
  type: 'image' | 'video' | 'speech' | 'audio'
  description?: string
}

export interface Style {
  id: string
  name: string
  description: string
  previewUrl?: string
}

export interface Motion {
  id: string
  name: string
  description?: string
  previewUrl?: string
}

export interface Character {
  id: string
  name: string
  status: string
}

export interface Provider {
  name: string
  generateImage(opts: ImageOptions): Promise<GenerationResult>
  generateVideo(opts: VideoOptions): Promise<GenerationResult>
  getStatus(requestId: string): Promise<StatusResult>
  listModels(): Promise<Model[]>
  listStyles(): Promise<Style[]>
  listMotions(): Promise<Motion[]>
  upload(filePath: string): Promise<string>
  listCharacters(): Promise<Character[]>
  createCharacter(name: string, imagePaths: string[]): Promise<Character>
}
