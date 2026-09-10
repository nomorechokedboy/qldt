import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import ResultsQr from '@/components/ResultsQr'
import { Button } from '@/components/ui/button'
import {
	clearResultsPayload,
	clearSession,
	loadResultsPayload
} from '@/lib/storage'

export const Route = createFileRoute('/results')({
	beforeLoad: () => {
		if (!loadResultsPayload()) {
			throw redirect({ to: '/' })
		}
	},
	component: ResultsPage
})

function ResultsPage() {
	const navigate = useNavigate()
	const payload = loadResultsPayload()
	if (!payload) return null

	function startNewSession() {
		clearSession()
		clearResultsPayload()
		navigate({ to: '/' })
	}

	return (
		<div className='flex flex-col items-center gap-4 text-center'>
			<p className='text-muted-foreground text-sm'>
				Đưa mã QR này vào camera trên máy tính để nhập kết quả kiểm kê.
			</p>
			<ResultsQr
				value={JSON.stringify(payload)}
				downloadFilename={`ket-qua-kiem-ke-${payload.sid}`}
			/>

			<Button type='button' className='w-full' onClick={startNewSession}>
				Xong, quét phiên mới
			</Button>
			<Button
				type='button'
				variant='outline'
				className='w-full'
				onClick={() => navigate({ to: '/checklist' })}
			>
				Quay lại danh sách
			</Button>
		</div>
	)
}
