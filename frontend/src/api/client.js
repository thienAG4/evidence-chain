import axios from 'axios'
import { logger } from '../utils/logger'

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('evidence_api_url')
    if (saved) return saved.replace(/\/+$/, '')
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://evidence-chain-backend.onrender.com'
    }
  }
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
}

export function setApiBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('evidence_api_url')
    } else {
      localStorage.setItem('evidence_api_url', url.trim().replace(/\/+$/, ''))
    }
  }
}

const client = axios.create({
  timeout: 30000
})

// Attach current baseURL dynamically before every request
client.interceptors.request.use((config) => {
  const currentBase = getApiBaseUrl()
  if (currentBase && !config.url?.startsWith('http://') && !config.url?.startsWith('https://')) {
    config.baseURL = currentBase
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const res = error.response
    const requestId = res?.headers?.['x-request-id'] || 'unknown'
    const errorData = res?.data?.error

    let defaultMsg = error.message
    if (res?.status === 405) {
      defaultMsg = 'Lỗi 405 (Method Not Allowed): Frontend chưa kết nối được máy chủ Backend (Render). Hãy nhấn vào nút "⚙️ Kết nối Backend" ở góc phải thanh menu để cài đặt địa chỉ máy chủ!'
    } else if (res?.status === 404 && !getApiBaseUrl() && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      defaultMsg = 'Lỗi 404: Chưa tìm thấy API Backend. Vui lòng cấu hình URL máy chủ Backend (Render)!'
    } else if (error.message === 'Network Error') {
      defaultMsg = 'Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra lại dịch vụ Render hoặc địa chỉ API.'
    }

    const normalizedError = {
      code: errorData?.code || (res?.status === 405 ? 'BACKEND_NOT_CONNECTED' : 'NETWORK_ERROR'),
      message: errorData?.message || defaultMsg,
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
