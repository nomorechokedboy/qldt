import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

interface WebcamQrScannerProps {
	onDecode: (text: string) => void
	// Pauses the scan loop (e.g. while a decoded payload is being submitted)
	// without tearing down the camera stream, so the view doesn't flicker
	// between "requesting camera" states between attempts.
	paused?: boolean
}

// Reads QR codes from the device's webcam via getUserMedia + jsQR, entirely
// client-side - nothing here talks to apps/api. Used to import the results
// QR shown on the phone. See the design doc for why a single static QR
// (not animated/multi-frame) is enough at this feature's data volume.
export default function WebcamQrScanner({
	onDecode,
	paused = false
}: WebcamQrScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let stream: MediaStream | undefined
		let frameId: number | undefined
		let cancelled = false

		async function start() {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: 'environment' }
				})
			} catch {
				if (!cancelled) {
					setError(
						'Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.'
					)
				}
				return
			}

			if (cancelled || !videoRef.current) {
				stream.getTracks().forEach((t) => t.stop())
				return
			}

			videoRef.current.srcObject = stream
			await videoRef.current.play()
			tick()
		}

		function tick() {
			frameId = requestAnimationFrame(tick)
			if (paused) return

			const video = videoRef.current
			const canvas = canvasRef.current
			if (
				!video ||
				!canvas ||
				video.readyState !== video.HAVE_ENOUGH_DATA
			)
				return

			canvas.width = video.videoWidth
			canvas.height = video.videoHeight
			const ctx = canvas.getContext('2d')
			if (!ctx) return

			ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
			const imageData = ctx.getImageData(
				0,
				0,
				canvas.width,
				canvas.height
			)
			const result = jsQR(
				imageData.data,
				imageData.width,
				imageData.height
			)
			if (result?.data) {
				onDecode(result.data)
			}
		}

		start()

		return () => {
			cancelled = true
			if (frameId !== undefined) cancelAnimationFrame(frameId)
			stream?.getTracks().forEach((t) => t.stop())
		}
	}, [])

	if (error) {
		return <p className='text-destructive text-sm'>{error}</p>
	}

	return (
		<div className='relative overflow-hidden rounded-md border'>
			{/* biome-ignore lint/a11y/useMediaCaption: live camera feed, not a media file */}
			<video
				ref={videoRef}
				className='w-full aspect-square object-cover'
				muted
				playsInline
			/>
			<canvas ref={canvasRef} className='hidden' />
		</div>
	)
}
