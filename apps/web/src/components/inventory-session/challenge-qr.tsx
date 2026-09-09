import QrCodeCanvas from '@/components/qr-code-canvas'

interface ChallengeQrProps {
	value: string
	downloadFilename?: string
}

export default function ChallengeQr({
	value,
	downloadFilename = 'ma-qr-kiem-ke'
}: ChallengeQrProps) {
	return (
		<QrCodeCanvas
			value={value}
			downloadFilename={downloadFilename}
			ariaLabel='Mã QR phiên kiểm kê'
		/>
	)
}
