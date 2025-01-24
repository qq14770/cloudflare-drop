export async function resolveFileByCode(
  code: string,
): Promise<ApiResponseType<FileType>> {
  const response = await fetch(`/files/share/${code}`)
  return await response.json()
}

export async function uploadFile(
  data: Blob,
): Promise<ApiResponseType<FileUploadedType>> {
  const formData = new FormData()
  formData.append('file', data)
  const response = await fetch('/files', {
    method: 'PUT',
    body: formData,
  })
  return await response.json()
}

export async function fetchPlainText(id: string): Promise<string> {
  const response = await fetch(`/files/${id}`)
  return response.text()
}
