import { GetUnitStatsStudents } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsStudents(alias: string | undefined) {
	return useQuery({
		queryKey: ['unit-stats-students', alias],
		queryFn: () => GetUnitStatsStudents(alias!),
		enabled: alias !== undefined
	})
}
