import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import QrCodeCanvas from '@/components/qr-code-canvas'
import { materialConditionLabels } from '@/data/material-categories'
import { buildMaterialAssetTagPayload } from '@/lib/material-asset-tag'
import type { MaterialAsset } from '@/types'

interface AssetQrDialogProps {
	data: MaterialAsset
	open: boolean
	onOpenChange: (open: boolean) => void
}

export default function AssetQrDialog({
	data,
	open,
	onOpenChange
}: AssetQrDialogProps) {
	const payload = buildMaterialAssetTagPayload(data)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-w-md flex-col items-center gap-4'>
				<DialogTitle>Mã QR khí tài - {data.serialNumber}</DialogTitle>
				<QrCodeCanvas
					value={JSON.stringify(payload)}
					downloadFilename={`qr-${data.serialNumber}`}
					ariaLabel={`Mã QR khí tài ${data.serialNumber}`}
				/>
				<p className='text-muted-foreground text-center text-sm'>
					In và dán mã này lên khí tài. Tình trạng tại thời điểm in:{' '}
					{materialConditionLabels[payload.condition] ??
						payload.condition}
					. Khi kiểm kê, tình trạng thực tế vẫn cần được xác nhận lại.
				</p>
			</DialogContent>
		</Dialog>
	)
}
