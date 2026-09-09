import { useState } from 'react'
import {
	Format,
	checkPermissions,
	requestPermissions,
	scan
} from '@tauri-apps/plugin-barcode-scanner'
import { Button } from '@/components/ui/button'

interface QrScannerProps {
	onDecode: (text: string) => void
}

// Uses Tauri's official barcode-scanner plugin (native camera view on
// Android/iOS, not a webview <video>/getUserMedia loop) to scan the
// challenge QR. See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
export default function QrScanner({ onDecode }: QrScannerProps) {
	const [scanning, setScanning] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleScan() {
		setError(null)
		try {
			let permission = await checkPermissions()
			if (permission !== 'granted') {
				permission = await requestPermissions()
			}
			if (permission !== 'granted') {
				setError('Cần cấp quyền camera để quét mã QR.')
				return
			}

			setScanning(true)
			const result = await scan({ formats: [Format.QRCode] })
			onDecode(result.content)
		} catch {
			// Includes a deliberate user cancel (back button on the native
			// scanner) - keep the message neutral rather than alarming.
			setError('Không quét được mã QR. Vui lòng thử lại.')
		} finally {
			setScanning(false)
		}
	}

	return (
		<div className='flex flex-col items-center gap-3'>
			<Button
				type='button'
				className='w-full'
				size='lg'
				onClick={handleScan}
				disabled={scanning}
			>
				{scanning ? 'Đang quét...' : 'Quét mã QR'}
			</Button>
			{error && <p className='text-destructive text-sm'>{error}</p>}
		</div>
	)
}
