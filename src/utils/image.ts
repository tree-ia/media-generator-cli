import { readFile } from 'fs/promises'

export function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/png'
}

export async function resolveToDataUri(pathOrUrl: string): Promise<string> {
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const buffer = await readFile(pathOrUrl)
  const mimeType = getMimeType(pathOrUrl)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function resolveToBase64(pathOrUrl: string): Promise<{ mimeType: string; data: string }> {
  if (pathOrUrl.startsWith('http')) {
    const response = await fetch(pathOrUrl)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${pathOrUrl}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const mimeType = response.headers.get('content-type') || 'image/png'
    return { mimeType, data: buffer.toString('base64') }
  }
  const buffer = await readFile(pathOrUrl)
  const mimeType = getMimeType(pathOrUrl)
  return { mimeType, data: buffer.toString('base64') }
}
