import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TransferFormData } from './use-transfer-form-data'
import type { TransferSelection } from './use-transfer-selection'

// A row with a checkbox named by its label, and anything else the row needs
// (e.g. a quantity) after it.
function CheckRow({
	id,
	checked,
	onCheckedChange,
	label,
	children
}: {
	id: string
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	label: ReactNode
	children?: ReactNode
}) {
	return (
		<div className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'>
			<label
				htmlFor={id}
				className='flex min-w-0 flex-1 items-center gap-2'
			>
				<Checkbox
					id={id}
					checked={checked}
					onCheckedChange={(next) => onCheckedChange(next === true)}
				/>
				<span className='text-sm'>{label}</span>
			</label>
			{children}
		</div>
	)
}

function ResourceList({
	emptyMessage,
	isEmpty,
	children
}: {
	emptyMessage: string
	isEmpty: boolean
	children: ReactNode
}) {
	return (
		// Radix wraps the content in a `display: table` div that grows to its
		// widest row; as a block it is bounded by the list instead.
		<ScrollArea className='h-64 rounded-md border p-2 [&_[data-radix-scroll-area-viewport]>div]:!block'>
			{isEmpty && (
				<p className='p-2 text-sm text-muted-foreground'>
					{emptyMessage}
				</p>
			)}
			{children}
		</ScrollArea>
	)
}

function TabLabel({ label, count }: { label: string; count: number }) {
	return (
		<>
			{label}{' '}
			{count > 0 && (
				<Badge variant='secondary' className='ml-1'>
					{count}
				</Badge>
			)}
		</>
	)
}

// What the source unit has to move - troopers, assets and stocks, a tab each -
// with what is ticked counted on the tab.
export default function ResourcePicker({
	data,
	selection
}: {
	data: TransferFormData
	selection: TransferSelection
}) {
	const { t } = useTranslation('proposals')
	const { sourceUnitStudents, sourceUnitAssets, sourceUnitStocks } = data

	return (
		<Tabs defaultValue='troopers'>
			<TabsList>
				<TabsTrigger value='troopers'>
					<TabLabel
						label={t('common.troopers')}
						count={selection.trooperIds.size}
					/>
				</TabsTrigger>
				<TabsTrigger value='assets'>
					<TabLabel
						label={t('transfer.assets')}
						count={selection.assetIds.size}
					/>
				</TabsTrigger>
				<TabsTrigger value='stocks'>
					<TabLabel
						label={t('transfer.stocks')}
						count={selection.stockQuantities.size}
					/>
				</TabsTrigger>
			</TabsList>

			<TabsContent value='troopers'>
				<ResourceList
					isEmpty={sourceUnitStudents.length === 0}
					emptyMessage={t('common.noTroopersInUnit')}
				>
					{sourceUnitStudents.map((s) => (
						<CheckRow
							key={s.id}
							id={`transfer-trooper-${s.id}`}
							checked={selection.trooperIds.has(s.id)}
							onCheckedChange={() =>
								selection.toggleTrooper(s.id)
							}
							label={s.fullName}
						/>
					))}
				</ResourceList>
			</TabsContent>

			<TabsContent value='assets'>
				<ResourceList
					isEmpty={sourceUnitAssets.length === 0}
					emptyMessage={t('transfer.noAssetsInUnit')}
				>
					{sourceUnitAssets.map((a) => (
						<CheckRow
							key={a.id}
							id={`transfer-asset-${a.id}`}
							checked={selection.assetIds.has(a.id)}
							onCheckedChange={() => selection.toggleAsset(a.id)}
							label={`${data.materialTypeName(a.materialTypeId)} — ${a.serialNumber}`}
						/>
					))}
				</ResourceList>
			</TabsContent>

			<TabsContent value='stocks'>
				<ResourceList
					isEmpty={sourceUnitStocks.length === 0}
					emptyMessage={t('transfer.noStocksInUnit')}
				>
					{sourceUnitStocks.map((s) => {
						const quantity = selection.stockQuantities.get(s.id)
						return (
							<CheckRow
								key={s.id}
								id={`transfer-stock-${s.id}`}
								checked={quantity !== undefined}
								onCheckedChange={(checked) =>
									selection.toggleStock(
										s.id,
										s.quantity,
										checked
									)
								}
								label={`${data.materialTypeName(s.materialTypeId)} ${t(
									'transfer.stockRemaining',
									{
										condition: s.condition,
										quantity: s.quantity
									}
								)}`}
							>
								{quantity !== undefined && (
									<Input
										type='number'
										min={1}
										max={s.quantity}
										value={quantity}
										onChange={(e) =>
											selection.setStockQuantity(
												s.id,
												Number(e.target.value),
												s.quantity
											)
										}
										className='h-8 w-20'
									/>
								)}
							</CheckRow>
						)
					})}
				</ResourceList>
			</TabsContent>
		</Tabs>
	)
}
