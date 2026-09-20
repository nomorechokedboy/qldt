import { useEffect, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { inventory_sessions } from '@/api/client'
import {
	useCreateInventorySession,
	useMarkInventorySessionReviewed,
	useOpenInventorySession,
	useSubmitInventorySessionResults
} from '@/hooks/useInventorySession'
import ChallengeQr from './challenge-qr'
import InventorySessionApplyPanel from './inventory-session-apply-panel'
import InventorySessionDiffList from './session-diff-list'
import InventorySessionStockDiffList from './stock-diff-list'
import WebcamQrScanner from './webcam-qr-scanner'

type Step = 'start' | 'challenge' | 'scan' | 'review'

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
	const { t } = useTranslation('materials')
	const [open, setOpen] = useState(false)
	const [step, setStep] = useState<Step>('start')
	const [challenge, setChallenge] =
		useState<inventory_sessions.InventorySessionChallengePayload | null>(
			null
		)
	const [review, setReview] =
		useState<inventory_sessions.InventorySessionReview | null>(null)
	// Set on any decode/submit failure - halts the scanner (see the `paused`
	// prop below) until the trooper explicitly retries. Without this, a QR
	// that fails server-side (already-completed session, tampered
	// signature...) but flickers in and out of the camera's decode on
	// consecutive frames - normal hand tremor is enough - would resubmit to
	// the server dozens of times a second with no way to stop it short of
	// closing the dialog.
	const [scanError, setScanError] = useState<string | null>(null)

	const createSession = useCreateInventorySession()
	const submitResults = useSubmitInventorySessionResults()
	const markReviewed = useMarkInventorySessionReviewed()
	// Checked on every open - if a session for this room is still
	// in_progress (the PC's tab was closed, or the machine was restarted,
	// while the phone was mid-scan), resume it instead of starting a
	// duplicate. See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
	const openSession = useOpenInventorySession(roomId, { enabled: open })

	const reset = () => {
		setStep('start')
		setChallenge(null)
		setReview(null)
		setScanError(null)
	}

	const handleOpenChange = (next: boolean) => {
		setOpen(next)
		if (!next) reset()
	}

	useEffect(() => {
		if (step !== 'start' || !openSession.data?.session) return
		setChallenge(openSession.data.session)
		setStep('challenge')
	}, [step, openSession.data])

	const handleStart = async () => {
		try {
			const payload = await createSession.mutateAsync(roomId)
			setChallenge(payload)
			setStep('challenge')
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t('inventory.dialog.createFailed')
			)
		}
	}

	const handleDecode = async (text: string) => {
		// `scanError` halts the scanner via `paused` below, but that guard
		// lags a render behind the ref the scan loop actually reads - this
		// closes that window so an in-flight frame can't sneak one more
		// decode through before the pause takes effect.
		if (submitResults.isPending || scanError !== null) return

		let payload: inventory_sessions.InventorySessionResultsPayload
		try {
			payload = JSON.parse(text)
		} catch {
			setScanError(t('inventory.dialog.invalidQr'))
			return
		}
		if (
			payload?.v !== 3 ||
			typeof payload?.sid !== 'number' ||
			!Array.isArray(payload?.results) ||
			!Array.isArray(payload?.stockResults)
		) {
			setScanError(t('inventory.dialog.wrongFormat'))
			return
		}

		try {
			const result = await submitResults.mutateAsync(payload)
			setReview(result)
			setStep('review')
		} catch (err) {
			setScanError(
				err instanceof Error
					? err.message
					: t('inventory.dialog.submitFailed')
			)
		}
	}

	const handleMarkReviewed = async () => {
		if (!review) return
		try {
			const result = await markReviewed.mutateAsync(review.session.id)
			setReview(result)
			toast.success(t('inventory.dialog.confirmed'))
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t('inventory.dialog.confirmFailed')
			)
		}
	}

	return (
		<>
			<Button
				size='icon'
				variant='ghost'
				title={t('inventory.dialog.triggerTitle')}
				onClick={() => setOpen(true)}
			>
				<ScanLine size={16} />
			</Button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className='max-w-md h-auto'>
					<DialogTitle>
						{t('inventory.dialog.title', { roomName })}
					</DialogTitle>

					{step === 'start' && (
						<div className='flex flex-col gap-4'>
							<p className='text-muted-foreground text-sm'>
								{t('inventory.dialog.intro')}
							</p>
							<Button
								onClick={handleStart}
								disabled={
									createSession.isPending ||
									openSession.isPending
								}
							>
								{openSession.isPending
									? t('inventory.dialog.checking')
									: createSession.isPending
										? t('inventory.dialog.creating')
										: t('inventory.dialog.create')}
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
								{t('inventory.dialog.challengeSummary', {
									assets: challenge.expected.length,
									stocks: challenge.expectedStocks.length
								})}
							</p>
							<Button onClick={() => setStep('scan')}>
								{t('inventory.dialog.scanResults')}
							</Button>
						</div>
					)}

					{step === 'scan' && (
						<div className='flex flex-col gap-4'>
							{/* Hidden (not just paused) once an error shows - the
							camera preview sitting right above the retry button
							otherwise draws all the attention and the button
							goes unnoticed. Unmounting also releases the
							camera stream while the trooper reads the error;
							it restarts fresh on retry. */}
							{scanError === null && (
								<WebcamQrScanner
									onDecode={handleDecode}
									paused={submitResults.isPending}
								/>
							)}
							{scanError ? (
								<div className='flex flex-col items-center gap-2'>
									<p className='text-destructive text-sm text-center'>
										{scanError}
									</p>
									<Button
										variant='outline'
										onClick={() => setScanError(null)}
									>
										{t('inventory.dialog.retryScan')}
									</Button>
								</div>
							) : (
								<p className='text-muted-foreground text-sm text-center'>
									{submitResults.isPending
										? t('inventory.dialog.recording')
										: t('inventory.dialog.aimAtQr')}
								</p>
							)}
						</div>
					)}

					{step === 'review' && review && (
						<div className='flex flex-col gap-4'>
							<div className='max-h-80 overflow-y-auto flex flex-col gap-4'>
								<InventorySessionDiffList diff={review.diff} />
								<InventorySessionStockDiffList
									stockDiff={review.stockDiff}
								/>
							</div>
							{review.session.status === 'reviewed' ? (
								<p className='text-muted-foreground text-sm text-center'>
									{t('inventory.dialog.reviewedNote')}
								</p>
							) : (
								<Button
									onClick={handleMarkReviewed}
									disabled={markReviewed.isPending}
								>
									{markReviewed.isPending
										? t('inventory.dialog.confirming')
										: t('inventory.dialog.confirm')}
								</Button>
							)}
							{review.session.status === 'reviewed' && (
								<InventorySessionApplyPanel
									session={review.session}
									diff={review.diff}
									stockDiff={review.stockDiff}
									onApplied={setReview}
								/>
							)}
							<Button
								variant='outline'
								onClick={() => handleOpenChange(false)}
							>
								{t('inventory.dialog.done')}
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
