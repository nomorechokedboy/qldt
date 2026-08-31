import { GetMaterialTypes } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useMaterialTypesData(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['material-types'],
		queryFn: () => GetMaterialTypes(),
		enabled: options?.enabled
	})
}
