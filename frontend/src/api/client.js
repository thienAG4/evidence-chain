import axios from 'axios'
import { logger } from '../utils/logger'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const client = axios.create({
  baseURL,
  timeout: 30000
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const res = error.response
    const requestId = res?.headers?.['x-request-id'] || 'unknown'
    const errorData = res?.data?.error

    const normalizedError = {
      code: errorData?.code || 'NETWORK_ERROR',
      message: errorData?.message || (error.message === 'Network Error' 
        ? 'Chưa kết nối được máy chủ backend. Vui lòng kiểm tra lại dịch vụ.' 
        : error.message),
      requestId,
      status: res?.status || 500
    }

    logger.error('API_ERROR', {
      url: error.config?.url,
      method: error.config?.method,
      status: res?.status,
      ...normalizedError
    })

    return Promise.reject(normalizedError)
  }
)

export default client
