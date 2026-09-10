import { useEffect, useRef, useState } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { Download } from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface ResultsQrProps {
	value: string
	downloadFilename?: string
}

// Renders a single static QR code for the signed results payload, for the
// PC's webcam to scan back. Not animated/multi-frame - see the payload-size
// math in docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md
// for why a single code is enough at platoon-armory scale.
export default function ResultsQr({
	value,
	downloadFilename = 'ket-qua-kiem-ke'
}: ResultsQrProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [error, setError] = useState<string | null>(null)
	const [downloadStatus, setDownloadStatus] = useState<
		'idle' | 'saved' | 'failed'
	>('idle')

	useEffect(() => {
		if (!canvasRef.current) return
		setError(null)
		QRCode.toCanvas(canvasRef.current, value, {
			width: 320,
			margin: 2,
			errorCorrectionLevel: 'M'
		}).catch(() => {
			setError('Không thể tạo mã QR - dữ liệu quá lớn cho một mã QR.')
		})
	}, [value])

	// A plain `<a download>` click does nothing in Tauri's WebView - there's
	// no browser download manager to catch it, especially on Android/iOS -
	// so the PNG has to be written to disk directly instead. Writing straight
	// to `BaseDirectory.Download` (tried first) silently lands in the app's
	// own private storage on Android - scoped storage blocks direct writes
	// to the real shared Downloads folder. Going through the native "Save As"
	// picker (Storage Access Framework) is what actually puts the file where
	// the user - and their file manager - can see it; plugin-fs's writeFile
	// accepts the content:// URI the picker returns on Android directly.
	const handleDownload = async () => {
		const canvas = canvasRef.current
		if (!canvas) return

		setDownloadStatus('idle')
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/png')
		)
		if (!blob) {
			setDownloadStatus('failed')
			return
		}

		try {
			const path = await save({
				defaultPath: `${downloadFilename}.png`,
				filters: [{ name: 'PNG Image', extensions: ['png'] }]
			})
			// User cancelled the picker - not a failure, just no-op back to idle.
			if (!path) return

			const bytes = new Uint8Array(await blob.arrayBuffer())
			await writeFile(path, bytes)
			setDownloadStatus('saved')
		} catch {
			setDownloadStatus('failed')
		}
	}

	if (error) {
		return <p className='text-destructive text-sm'>{error}</p>
	}

	return (
		<div className='flex flex-col items-center gap-3'>
			<div className='border-border rounded-md border-2 bg-white p-3'>
				<canvas ref={canvasRef} aria-label='Mã QR kết quả kiểm kê' />
			</div>
			<Button type='button' variant='outline' onClick={handleDownload}>
				<Download className='w-4 h-4 mr-2' />
				Tải xuống mã QR
			</Button>
			{downloadStatus === 'saved' && (
				<p className='text-muted-foreground text-sm'>Đã lưu mã QR.</p>
			)}
			{downloadStatus === 'failed' && (
				<p className='text-destructive text-sm'>Không thể lưu mã QR.</p>
			)}
		</div>
	)
}
