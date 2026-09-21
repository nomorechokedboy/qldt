import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { transfer_requests } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import UnitSelect from '@/components/unit/select'
import { useCreateTransferRequest } from '@/hooks/useCreateTransferRequest'
import { toastApiError } from '@/lib/api-error'
import ResourcePicker from './resource-picker'
import useTransferFormData from './use-transfer-form-data'
import useTransferSelection from './use-transfer-selection'

const NONE = 'none'

export default function CreateTransferRequestForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const { t } = useTranslation('proposals')
	const [open, setOpen] = useState(false)
	const [sourceUnitId, setSourceUnitId] = useState('')
	const [destinationUnitId, setDestinationUnitId] = useState('')
	const [destinationRoomId, setDestinationRoomId] = useState(NONE)
	const [approverUserId, setApproverUserId] = useState('')
	const selection = useTransferSelection()

	const data = useTransferFormData({ open, sourceUnitId, destinationUnitId })
	const createMutation = useCreateTransferRequest()

	const resetForm = () => {
		setSourceUnitId('')
		setDestinationUnitId('')
		setDestinationRoomId(NONE)
		setApproverUserId('')
		selection.clear()
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (selection.total === 0) {
			toast.error(t('transfer.selectAtLeastOne'))
			return
		}

		const body: transfer_requests.CreateTransferRequestBody = {
			sourceUnitId: Number(sourceUnitId),
			destinationUnitId: Number(destinationUnitId),
			destinationRoomId:
				destinationRoomId === NONE ? null : Number(destinationRoomId),
			approverUserId: Number(approverUserId),
			troopers: [...selection.trooperIds].map((studentId) => ({
				studentId
			})),
			materialAssets: [...selection.assetIds].map((materialAssetId) => ({
				materialAssetId
			})),
			materialStocks: data.sourceUnitStocks.flatMap((stock) => {
				const quantity = selection.stockQuantities.get(stock.id)
				return quantity === undefined
					? []
					: [
							{
								materialTypeId: stock.materialTypeId,
								condition: stock.condition ?? 'good',
								quantity
							}
						]
			})
		}

		try {
			await createMutation.mutateAsync(body)
			toast.success(t('transfer.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toastApiError(t('transfer.createFailed'), err)
		}
	}

	const needsUnits = !sourceUnitId || !destinationUnitId

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
		>
			<SheetTrigger asChild>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					{t('transfer.createButton')}
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
				<SheetHeader>
					<SheetTitle>{t('transfer.formTitle')}</SheetTitle>
				</SheetHeader>
				<form
					id='create-transfer-request-form'
					className='space-y-4 px-4 pb-4'
					onSubmit={handleSubmit}
				>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<div className='space-y-2'>
							<Label>{t('transfer.sourceUnit')}</Label>
							<UnitSelect
								options={data.sourceUnitOptions}
								value={sourceUnitId}
								placeholder={t('transfer.pickSourceUnit')}
								onValueChange={(v) => {
									setSourceUnitId(v)
									selection.clear()
									setApproverUserId('')
								}}
							/>
						</div>

						<div className='space-y-2'>
							<Label>{t('transfer.destinationUnit')}</Label>
							<UnitSelect
								options={data.destinationUnitOptions}
								value={destinationUnitId}
								placeholder={t('transfer.pickDestinationUnit')}
								onValueChange={(v) => {
									setDestinationUnitId(v)
									setDestinationRoomId(NONE)
									setApproverUserId('')
								}}
							/>
						</div>

						<div className='space-y-2'>
							<Label>
								{t('transfer.destinationRoomOptional')}
							</Label>
							<Select
								value={destinationRoomId}
								onValueChange={setDestinationRoomId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t('transfer.pickRoom')}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NONE}>
										{t('transfer.noRoom')}
									</SelectItem>
									{data.destinationRooms.map((r) => (
										<SelectItem
											key={r.id}
											value={String(r.id)}
										>
											{r.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label>{t('common.approver')}</Label>
							<Select
								value={approverUserId}
								onValueChange={setApproverUserId}
								disabled={needsUnits}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t('common.pickApprover')}
									/>
								</SelectTrigger>
								<SelectContent>
									{data.eligibleApprovers.map((u) => (
										<SelectItem
											key={u.id}
											value={String(u.id)}
										>
											{u.displayName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className='text-xs text-muted-foreground'>
								{needsUnits
									? t('transfer.approverNeedsUnits')
									: data.eligibleApprovers.length === 0
										? t('transfer.approverNone')
										: t('transfer.approverHint')}
							</p>
						</div>
					</div>

					{sourceUnitId ? (
						<ResourcePicker data={data} selection={selection} />
					) : (
						<p className='py-6 text-center text-sm text-muted-foreground'>
							{t('transfer.pickSourceForResources')}
						</p>
					)}
				</form>
				<SheetFooter>
					<Button
						type='submit'
						form='create-transfer-request-form'
						disabled={
							createMutation.isPending ||
							needsUnits ||
							!approverUserId
						}
					>
						{createMutation.isPending
							? t('common.creating')
							: t('transfer.submit')}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
