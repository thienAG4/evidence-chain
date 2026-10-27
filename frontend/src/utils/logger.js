import axios from 'axios'

const clientApi = axios.create()

export const logger = {
  info(event, details) {
    console.log(`[INFO] [${event}]`, details || '')
  },
  warn(event, details) {
    console.warn(`[WARN] [${event}]`, details || '')
  },
  error(event, details) {
    console.error(`[ERROR] [${event}]`, details || '')
    // Asynchronously dispatch client-side error to backend
    try {
      clientApi.post('/api/logs/client', {
        level: 'ERROR',
        event: event || 'CLIENT_ERROR',
        message: typeof details === 'string' ? details : (details?.message || 'Client runtime error'),
        details: typeof details === 'object' ? details : { raw: details }
      }).catch(() => {})
    } catch (e) {
      // Ignore network failures for error reporter
    }
  }
}
