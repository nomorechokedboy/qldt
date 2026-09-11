import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface QrCodeCanvasProps {
	value: string
	downloadFilename: string
	ariaLabel: string
}

// Renders a single static QR code for the given string, with a download
// button. Deliberately not animated/multi-frame - see the payload-size math
// in docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md for why
// a single code is enough at platoon-armory scale. Shared by challenge-qr.tsx
// (inventory-session challenge) and asset-qr-dialog.tsx (per-asset tag).
export default function QrCodeCanvas({
	value,
	downloadFilename,
	ariaLabel
}: QrCodeCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!canvasRef.current) return
		setError(null)
		QRCode.toCanvas(canvasRef.current, value, {
			width: 320,
			margin: 2,
			errorCorrectionLevel: 'L'
		}).catch(() => {
			setError('Không thể tạo mã QR - dữ liệu quá lớn cho một mã QR.')
		})
	}, [value])

	const handleDownload = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const link = document.createElement('a')
		link.href = canvas.toDataURL('image/png')
		link.download = `${downloadFilename}.png`

		document.body.appendChild(link)
		link.click()

		document.body.removeChild(link)
	}

	if (error) {
		return <p className='text-destructive text-sm'>{error}</p>
	}

	return (
		<div className='flex flex-col items-center gap-3'>
			<canvas
				ref={canvasRef}
				className='rounded-md border bg-white'
				aria-label={ariaLabel}
			/>
			<Button type='button' variant='outline' onClick={handleDownload}>
				<Download className='w-4 h-4 mr-2' />
				Tải xuống mã QR
			</Button>
		</div>
	)
}
