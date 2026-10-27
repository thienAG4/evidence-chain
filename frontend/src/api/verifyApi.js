import client from './client'

export async function verifyEvidence({ file, evidenceId, txHash }, onProgress) {
  const fd = new FormData()
  fd.append('file', file)
  if (evidenceId) fd.append('evidence_id', evidenceId.trim())
  if (txHash) fd.append('tx_hash', txHash.trim())

  const { data } = await client.post('/api/verify', fd, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }
  })
  return data
}
