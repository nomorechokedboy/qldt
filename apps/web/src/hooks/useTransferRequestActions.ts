import {
	ApproveTransferRequest,
	CancelTransferRequest,
	ExportTransferRequestHandover,
	RejectTransferRequest
} from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useApproveTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => ApproveTransferRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}

export function useRejectTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) =>
			RejectTransferRequest(id, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}

export function useCancelTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => CancelTransferRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}

export function useExportTransferRequestHandover() {
	return useMutation({
		mutationFn: async (id: number) => {
			const resp = await ExportTransferRequestHandover(id)
			if (!resp.ok) {
				const message = await resp.text().catch(() => '')
				throw new Error(message || 'Xuất biên bản bàn giao thất bại!')
			}

			const blob = await resp.blob()
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `bien-ban-ban-giao-${id}.docx`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
		}
	})
}
