export function truncateHash(hash, front = 6, back = 6) {
  if (!hash) return ''
  if (hash.length <= front + back) return hash
  return `${hash.slice(0, front)}...${hash.slice(-back)}`
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatDateTime(dateInput) {
  if (!dateInput) return { utc: '-', local: '-' }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return { utc: String(dateInput), local: String(dateInput) }

  // UTC string
  const utc = d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  // GMT+7 / Local Vietnam string
  const local = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(d) + ' (GMT+7)'

  return { utc, local }
}

export function groupHash(hash, groupSize = 8) {
  if (!hash) return ''
  const regex = new RegExp(`.{1,${groupSize}}`, 'g')
  return hash.match(regex)?.join(' ') || hash
}
