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

	// The scan loop below only starts once (see the empty deps array further
	// down) so the camera stream doesn't restart - and flicker - every time
	// `paused` or `onDecode` change identity. It reads these through refs
	// instead of closing over the props directly, so it always sees the
	// current values rather than the ones captured at mount.
	const onDecodeRef = useRef(onDecode)
	const pausedRef = useRef(paused)
	// Last decoded QR text still visible in frame - see the coalescing
	// comment in `tick` below.
	const lastDecodedRef = useRef<string | null>(null)
	useEffect(() => {
		onDecodeRef.current = onDecode
		pausedRef.current = paused
	}, [onDecode, paused])

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
			if (pausedRef.current) return

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
			// Coalesce: a still-visible QR code decodes on every single frame
			// (tens of times a second). Without this, a failed submit (e.g.
			// the session was already completed) re-fires on the very next
			// frame since `pausedRef` only guards the in-flight window, not
			// the frame right after it clears - flooding the server with
			// identical requests. Only fire once per physical showing of a
			// code; the code must actually leave the frame before the same
			// text can trigger onDecode again.
			if (result?.data) {
				if (result.data !== lastDecodedRef.current) {
					lastDecodedRef.current = result.data
					onDecodeRef.current(result.data)
				}
			} else {
				lastDecodedRef.current = null
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
