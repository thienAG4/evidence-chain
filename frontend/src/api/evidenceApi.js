import client from './client'

export async function submitEvidence(
  { file, caseCode, title, description, submittedBy },
  onProgress
) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('case_code', caseCode)
  fd.append('title', title)
  fd.append('description', description || '')
  fd.append('submitted_by', submittedBy)

  const { data } = await client.post('/api/evidence', fd, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }
  })
  return data
}

export const getEvidence = (id) => client.get(`/api/evidence/${id}`).then((r) => r.data)

export const listEvidence = (params) => client.get('/api/evidence', { params }).then((r) => r.data)

export const retryEvidence = (id) => client.post(`/api/evidence/${id}/retry`).then((r) => r.data)

export function downloadReceiptFile(evidenceId) {
  window.open(`/api/evidence/${evidenceId}/receipt`, '_blank')
}
