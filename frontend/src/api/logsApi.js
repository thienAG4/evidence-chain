import client from './client'

export const getHealth = () => client.get('/api/health').then((r) => r.data)

export const getAuditLogs = (params) => client.get('/api/audit-logs', { params }).then((r) => r.data)
