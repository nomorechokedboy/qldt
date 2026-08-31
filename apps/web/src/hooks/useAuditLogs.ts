import { GetAuditLogs } from '@/api'
import type { audit_logs } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useAuditLogs(params?: audit_logs.GetAuditLogsQuery) {
	return useQuery({
		queryKey: ['audit-logs', params],
		queryFn: () => GetAuditLogs(params)
	})
}
