import { GetUnitStatsStudents } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsStudents(id: number | undefined) {
	return useQuery({
		queryKey: ['unit-stats-students', id],
		queryFn: () => GetUnitStatsStudents(id!),
		enabled: id !== undefined
	})
}
