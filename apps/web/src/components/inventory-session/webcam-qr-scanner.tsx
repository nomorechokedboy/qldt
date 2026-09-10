import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [error, setError] = useState<string | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)

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

	// Decodes a single still image (as opposed to `tick`'s continuous webcam
	// frames) - the fallback for when the camera is unavailable/denied, or
	// the results QR was saved as a screenshot rather than shown live.
	async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ''
		if (!file) return

		setFileError(null)
		const objectUrl = URL.createObjectURL(file)
		try {
			const img = new Image()
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve()
				img.onerror = () => reject(new Error('invalid image'))
				img.src = objectUrl
			})

			const canvas = document.createElement('canvas')
			canvas.width = img.naturalWidth
			canvas.height = img.naturalHeight
			const ctx = canvas.getContext('2d')
			if (!ctx) throw new Error('no canvas context')
			ctx.drawImage(img, 0, 0)
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
				onDecodeRef.current(result.data)
			} else {
				setFileError(
					'Không tìm thấy mã QR trong ảnh, vui lòng thử ảnh khác.'
				)
			}
		} catch {
			setFileError('Không đọc được ảnh này, vui lòng thử ảnh khác.')
		} finally {
			URL.revokeObjectURL(objectUrl)
		}
	}

	return (
		<div className='flex flex-col gap-3'>
			{error ? (
				<p className='text-destructive text-sm'>{error}</p>
			) : (
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
			)}

			<div className='flex flex-col items-center gap-2'>
				<p className='text-muted-foreground text-xs'>
					{error
						? 'Bạn có thể tải lên ảnh chụp mã QR thay thế.'
						: 'Hoặc tải lên ảnh chụp mã QR nếu không dùng được camera.'}
				</p>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={() => fileInputRef.current?.click()}
				>
					<Upload />
					Tải ảnh lên
				</Button>
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					className='hidden'
					onChange={handleFileChange}
				/>
				{fileError && (
					<p className='text-destructive text-sm'>{fileError}</p>
				)}
			</div>
		</div>
	)
}
