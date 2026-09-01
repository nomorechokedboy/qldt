import {
	DeleteExportTemplate,
	ListExportTemplates,
	UploadExportTemplate
} from '@/api'
import type { ExportResourceType } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useExportTemplates(resourceType: ExportResourceType) {
	return useQuery({
		queryKey: ['export-templates', resourceType],
		queryFn: () => ListExportTemplates(resourceType)
	})
}

export function useUploadExportTemplate(resourceType: ExportResourceType) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: FormData) => UploadExportTemplate(body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['export-templates', resourceType]
			})
		}
	})
}

export function useDeleteExportTemplate(resourceType: ExportResourceType) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => DeleteExportTemplate(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['export-templates', resourceType]
			})
		}
	})
}
