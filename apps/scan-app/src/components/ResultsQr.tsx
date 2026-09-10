import { useEffect, useRef, useState } from 'react'
import { BaseDirectory, writeFile } from '@tauri-apps/plugin-fs'
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
	// so the PNG has to be written to disk directly via plugin-fs instead.
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
			const bytes = new Uint8Array(await blob.arrayBuffer())
			await writeFile(`${downloadFilename}.png`, bytes, {
				baseDir: BaseDirectory.Download
			})
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
			<canvas
				ref={canvasRef}
				className='rounded-lg border bg-white'
				aria-label='Mã QR kết quả kiểm kê'
			/>
			<Button type='button' variant='outline' onClick={handleDownload}>
				<Download className='w-4 h-4 mr-2' />
				Tải xuống mã QR
			</Button>
			{downloadStatus === 'saved' && (
				<p className='text-muted-foreground text-sm'>
					Đã lưu vào thư mục Download.
				</p>
			)}
			{downloadStatus === 'failed' && (
				<p className='text-destructive text-sm'>Không thể lưu mã QR.</p>
			)}
		</div>
	)
}
