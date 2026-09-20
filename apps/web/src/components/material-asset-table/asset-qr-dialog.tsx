import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import QrCodeCanvas from '@/components/qr-code-canvas'
import { materialConditionLabels } from '@/data/material-categories'
import { buildMaterialAssetTagPayload } from '@/lib/material-asset-tag'
import type { MaterialAsset } from '@/types'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('materials')
	const payload = buildMaterialAssetTagPayload(data)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex h-auto max-w-md flex-col items-center gap-4'>
				<DialogTitle>
					{t('assetQr.title', { serial: data.serialNumber })}
				</DialogTitle>
				<QrCodeCanvas
					value={JSON.stringify(payload)}
					downloadFilename={`qr-${data.serialNumber}`}
					ariaLabel={t('assetQr.ariaLabel', {
						serial: data.serialNumber
					})}
				/>
				<p className='text-muted-foreground text-center text-sm'>
					{t('assetQr.hint', {
						condition:
							materialConditionLabels[payload.condition] ??
							payload.condition
					})}
				</p>
			</DialogContent>
		</Dialog>
	)
}
