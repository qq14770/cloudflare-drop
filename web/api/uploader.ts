import axios, { AxiosProgressEvent } from 'axios'
import { getUserUUID } from '../helpers'

interface ChunkInfo {
  sha: string
  uuid: string
  size: number
  chunks: Array<{
    chunkId: number
    size: number
  }>
  finished: Array<number>
}

export class Uploader {
  static KV_CHUNK_SIZE = 25 * 1024 * 1024
  static MAX_KV_CHUNK_SIZE = 100 * 1024 * 1024
  static CHUNK_SIZE = 5 * 1024 * 1024

  static async upload(
    formData: FormData,
    onUpload?: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<ApiResponseType<FileUploadedType>> {
    const file: Blob | null = formData.get('file') as Blob
    // 使用默认的上传
    if (file.size <= this.CHUNK_SIZE) {
      const { data } = await axios.put('/files', formData, {
        onUploadProgress: onUpload,
      })
      return data as ApiResponseType<FileUploadedType>
    }
    if (file.size <= this.KV_CHUNK_SIZE) {
      const { objectId, sha } = await this.uploadWithChunk(file)
      formData.delete('file') // 移除 file
      formData.append(
        'fileInfo',
        JSON.stringify({
          objectId,
          name: file.name,
          type: file.type,
          size: file.size,
          sha,
        }),
      )
      const { data } = await axios.put('/files', formData)
      return data as ApiResponseType<FileUploadedType>
    }
    if (file.size <= this.MAX_KV_CHUNK_SIZE) {
      const size = file.size
      const chunkSize = file.size / this.KV_CHUNK_SIZE
      const tasks = []
      for (let i = 0; i < chunkSize; i++) {
        const start = i * this.KV_CHUNK_SIZE
        const end = Math.min(start + this.KV_CHUNK_SIZE, size)
        const chunk = file.slice(start, end)
        tasks.push(this.uploadWithChunk(chunk))
      }
      const chunkInfo = (await Promise.all(tasks)).map((d, i) => ({
        ...d,
        chunkId: i,
      }))
      formData.delete('file') // 移除 file
      formData.append(
        'fileInfo',
        JSON.stringify({
          objectId: chunkInfo,
          name: file.name,
          type: file.type,
          size: file.size,
          sha: await this.getSHA(file),
        }),
      )
      const { data } = await axios.put('/files', formData)
      return data as ApiResponseType<FileUploadedType>
    }
    throw new Error('建议使用 R2')
  }

  static async uploadWithChunk(blob: Blob): Promise<{
    objectId: string
    sha: string
  }> {
    // 计算 md5
    const sha = await this.getSHA(blob)
    const uuid = getUserUUID()
    const size = blob.size
    const totalChunks = Math.ceil(blob.size / this.CHUNK_SIZE)
    const chunks = new Array(totalChunks).fill(1).map((_, i) => ({
      chunkId: i,
      size:
        i < totalChunks - 1
          ? this.CHUNK_SIZE
          : size + this.CHUNK_SIZE - this.CHUNK_SIZE * totalChunks,
    }))
    const chunkInfo = await this.getChunkInfo({
      sha,
      uuid,
      size: blob.size,
      chunks,
    })

    const tasks: Array<Promise<unknown>> = []

    for (let i = 0; i < totalChunks; i++) {
      if (chunkInfo.finished.includes(i)) {
        continue
      }
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, size)
      const chunk = blob.slice(start, end)
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkId', `${i}`)
      formData.append('uuid', uuid)
      formData.append('sha', sha)
      tasks.push(this.uploadChunk(formData))
    }

    await Promise.all(tasks)
    // 告知合并
    const mergedResponse = await fetch('/files/chunks/merged', {
      method: 'POST',
      body: JSON.stringify({
        sha,
        uuid,
      }),
    })

    const data: ApiResponseType<string> = await mergedResponse.json()
    if (!data.result) {
      throw new Error(data.message)
    }
    return { objectId: data.data!, sha }
  }

  private static async uploadChunk(formData: FormData) {
    return fetch('/files/chunks', {
      method: 'PUT',
      body: formData,
    })
  }

  private static async getChunkInfo(
    info: Omit<ChunkInfo, 'finished'>,
  ): Promise<ChunkInfo> {
    const response = await fetch('/files/chunks', {
      method: 'POST',
      body: JSON.stringify(info),
    })

    const data: ApiResponseType<ChunkInfo> = await response.json()

    if (!data.result) {
      throw new Error('获取分片信息失败')
    }
    return data.data!
  }

  private static async getSHA(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
