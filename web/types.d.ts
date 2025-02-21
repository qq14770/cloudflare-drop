interface FileType {
  id: string
  code: string
  filename: string
  hash: string
  due_date: number
  type: string
  size: number
}

interface FileUploadedType {
  hash: string
  code: string
  due_date: number
}

interface ApiResponseType<T> {
  message: string
  result: boolean
  data: T | null
}
