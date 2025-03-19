import axios, { AxiosProgressEvent } from 'axios'
import { Encryptor } from '../helpers'
import { Uploader } from './uploader.ts'

async function processResponse(response: Response) {
  if (response.ok) return await response.json()

  return {
    result: false,
    data: null,
    message: await response.text(),
  }
}

export async function resolveFileByCode(
  code: string,
): Promise<ApiResponseType<FileType & { token: string }>> {
  const response = await fetch(`/files/share/${code}`)
  return processResponse(response)
}

export async function uploadFile(
  fileInfo: {
    data: Blob
    isEphemeral?: boolean
    duration?: string | null
    password?: string
  },
  onUpload?: (progressEvent: AxiosProgressEvent) => void,
): Promise<ApiResponseType<FileUploadedType>> {
  const { data, isEphemeral = false, duration = '', password } = fileInfo
  const formData = new FormData()
  if (password) {
    formData.append('file', await Encryptor.encrypt(password, data))
    formData.append('isEncrypted', JSON.stringify(true))
  } else {
    formData.append('file', data)
  }
  formData.append('isEphemeral', JSON.stringify(isEphemeral))
  formData.append('duration', JSON.stringify(duration))
  try {
    return Uploader.upload(formData, onUpload)
  } catch (e) {
    return {
      result: false,
      data: null,
      message: (e as Error)?.message ?? JSON.stringify(e),
    }
  }
}

export async function fetchPlainText(
  id: string,
  password?: string,
  token?: string,
): Promise<string> {
  const response = await fetch(`/files/${id}?token=${token}`)
  if (!password) {
    return response.text()
  }
  const blob = await response.blob()
  const decryptedBlob = await Encryptor.decrypt(password, blob)
  return decryptedBlob.text()
}

export async function fetchFile(
  cacheFile: Blob | null,
  id: string,
  password: string,
  filename: string,
  token?: string,
  onDownload?: (e: AxiosProgressEvent) => void,
): Promise<[file: Blob, error: Error | null]> {
  let blob: Blob
  if (!cacheFile) {
    const response = await axios.get(`/files/${id}?token=${token}`, {
      responseType: 'blob',
      onDownloadProgress: onDownload,
    })
    blob = response.data
  } else {
    blob = cacheFile
  }
  try {
    const decryptedBlob = await Encryptor.decrypt(password, blob)
    const file = new File([decryptedBlob], filename, {
      type: decryptedBlob.type,
    })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    return [blob, e as Error]
  }
  return [blob, null]
}
