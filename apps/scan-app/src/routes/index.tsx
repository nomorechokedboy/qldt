import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import QrScanner from '@/components/QrScanner'
import { parseChallengePayload } from '@/lib/payload'
import { loadSession, saveSession } from '@/lib/storage'
import type { SessionState } from '@/lib/storage'

export const Route = createFileRoute('/')({
	// A session already in progress skips straight to the checklist instead
	// of flashing the scan screen - see the design doc's "phone app killed
	// mid-session" error handling.
	beforeLoad: () => {
		if (loadSession()) {
			throw redirect({ to: '/checklist' })
		}
	},
	component: ScanPage
})

function ScanPage() {
	const navigate = useNavigate()
	const [scanError, setScanError] = useState<string | null>(null)

	function handleDecode(text: string) {
		const challenge = parseChallengePayload(text)
		if (!challenge) {
			setScanError(
				'Mã QR không hợp lệ hoặc không đúng định dạng phiên kiểm kê'
			)
			return
		}
		setScanError(null)
		const next: SessionState = { challenge, scans: {}, stockCounts: {} }
		saveSession(next)
		navigate({ to: '/checklist' })
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='bg-card border-border rounded-md border p-4 text-center'>
				<p className='text-muted-foreground text-sm'>
					Quét mã QR phiên kiểm kê hiển thị trên màn hình máy tính.
				</p>
			</div>
			<QrScanner onDecode={handleDecode} />
			{scanError && (
				<p className='text-destructive text-sm'>{scanError}</p>
			)}
		</div>
	)
}
