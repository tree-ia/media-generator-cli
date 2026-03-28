import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

export async function downloadToFile(url: string, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true })

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
}

export function inferExtension(url: string, type: 'image' | 'video'): string {
  const urlPath = new URL(url).pathname
  const ext = urlPath.split('.').pop()

  if (ext && ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mov', 'webm'].includes(ext)) {
    return `.${ext}`
  }

  return type === 'video' ? '.mp4' : '.png'
}
