import { useState } from 'react'
import { ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { inventory_sessions } from '@/api/client'
import {
	useCreateInventorySession,
	useSubmitInventorySessionResults
} from '@/hooks/useInventorySession'
import ChallengeQr from './challenge-qr'
import WebcamQrScanner from './webcam-qr-scanner'

type Step = 'start' | 'challenge' | 'scan' | 'review'

const STATUS_LABEL: Record<
	inventory_sessions.InventorySessionDiffStatus,
	{
		label: string
		variant: 'default' | 'destructive' | 'secondary' | 'outline'
	}
> = {
	matched: { label: 'Khớp', variant: 'secondary' },
	missing: { label: 'Thiếu', variant: 'destructive' },
	extra: { label: 'Phát sinh', variant: 'outline' },
	condition_changed: { label: 'Đổi tình trạng', variant: 'default' }
}

interface InventorySessionDialogProps {
	roomId: number
	roomName: string
}

// Full scan-reconciliation flow for one room: generate the challenge QR ->
// (trooper scans it offline on the Tauri app, not part of this dialog) ->
// scan the results QR back via webcam -> show the diff. See
// docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
export default function InventorySessionDialog({
	roomId,
	roomName
}: InventorySessionDialogProps) {
	const [open, setOpen] = useState(false)
	const [step, setStep] = useState<Step>('start')
	const [challenge, setChallenge] =
		useState<inventory_sessions.InventorySessionChallengePayload | null>(
			null
		)
	const [review, setReview] =
		useState<inventory_sessions.InventorySessionReview | null>(null)

	const createSession = useCreateInventorySession()
	const submitResults = useSubmitInventorySessionResults()

	const reset = () => {
		setStep('start')
		setChallenge(null)
		setReview(null)
	}

	const handleOpenChange = (next: boolean) => {
		setOpen(next)
		if (!next) reset()
	}

	const handleStart = async () => {
		try {
			const payload = await createSession.mutateAsync(roomId)
			setChallenge(payload)
			setStep('challenge')
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Không thể tạo phiên kiểm kê cho phòng này'
			)
		}
	}

	const handleDecode = async (text: string) => {
		if (submitResults.isPending) return

		let payload: inventory_sessions.InventorySessionResultsPayload
		try {
			payload = JSON.parse(text)
		} catch {
			toast.error('Mã QR không hợp lệ, vui lòng thử lại')
			return
		}
		if (
			typeof payload?.sid !== 'number' ||
			!Array.isArray(payload?.results)
		) {
			toast.error('Mã QR không đúng định dạng kết quả kiểm kê')
			return
		}

		try {
			const result = await submitResults.mutateAsync(payload)
			setReview(result)
			setStep('review')
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Không thể ghi nhận kết quả kiểm kê - mã QR có thể đã bị thay đổi hoặc phiên đã đóng'
			)
		}
	}

	return (
		<>
			<Button
				size='icon'
				variant='ghost'
				title='Kiểm kê bằng mã QR'
				onClick={() => setOpen(true)}
			>
				<ScanLine size={16} />
			</Button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className='max-w-md h-auto'>
					<DialogTitle>Kiểm kê - {roomName}</DialogTitle>

					{step === 'start' && (
						<div className='flex flex-col gap-4'>
							<p className='text-muted-foreground text-sm'>
								Tạo mã QR để bắt đầu phiên kiểm kê vũ khí/trang
								bị trong phòng này. Dùng ứng dụng trên điện
								thoại để quét mã và kiểm kê ngoại tuyến.
							</p>
							<Button
								onClick={handleStart}
								disabled={createSession.isPending}
							>
								{createSession.isPending
									? 'Đang tạo...'
									: 'Tạo mã QR kiểm kê'}
							</Button>
						</div>
					)}

					{step === 'challenge' && challenge && (
						<div className='flex flex-col items-center gap-4'>
							<ChallengeQr
								value={JSON.stringify(challenge)}
								downloadFilename={`kiem-ke-${roomName}-${challenge.sid}`}
							/>
							<p className='text-muted-foreground text-sm text-center'>
								{challenge.expected.length} vật tư cần kiểm kê.
								Quét mã này bằng ứng dụng trên điện thoại, sau
								khi hoàn tất kiểm kê hãy bấm nút bên dưới để
								quét lại kết quả.
							</p>
							<Button onClick={() => setStep('scan')}>
								Quét kết quả từ điện thoại
							</Button>
						</div>
					)}

					{step === 'scan' && (
						<div className='flex flex-col gap-4'>
							<WebcamQrScanner
								onDecode={handleDecode}
								paused={submitResults.isPending}
							/>
							<p className='text-muted-foreground text-sm text-center'>
								{submitResults.isPending
									? 'Đang ghi nhận kết quả...'
									: 'Đưa mã QR kết quả trên điện thoại vào khung hình.'}
							</p>
						</div>
					)}

					{step === 'review' && review && (
						<div className='flex flex-col gap-4'>
							<div className='max-h-80 overflow-y-auto space-y-2'>
								{review.diff.map((item) => (
									<div
										key={item.serial}
										className='flex items-center justify-between rounded-md border p-2 text-sm'
									>
										<span className='font-mono'>
											{item.serial}
										</span>
										<Badge
											variant={
												STATUS_LABEL[item.status]
													.variant
											}
										>
											{STATUS_LABEL[item.status].label}
										</Badge>
									</div>
								))}
								{review.diff.length === 0 && (
									<p className='text-muted-foreground text-sm text-center'>
										Không có dữ liệu chênh lệch.
									</p>
								)}
							</div>
							<Button onClick={() => handleOpenChange(false)}>
								Xong
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
