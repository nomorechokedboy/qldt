import { Building2, DoorOpen, Package, Shield, Users } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Route } from '@/routes/thong-ke-doanh-trai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectSeparator,
	SelectGroup,
	SelectLabel
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table'
import TableSkeleton from '@/components/table-skeleton'
import useAuth from '@/hooks/useAuth'
import useUnitsData from '@/hooks/useUnitsData'
import useUnitStats from '@/hooks/useUnitStats'
import useUnitStatsStudents from '@/hooks/useUnitStatsStudents'
import useUnitStatsMaterialStocks from '@/hooks/useUnitStatsMaterialStocks'
import useUnitStatsMaterialAssets from '@/hooks/useUnitStatsMaterialAssets'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import { buildMaterialStockColumns } from '@/components/material-stock-table/columns'
import { buildMaterialAssetColumns } from '@/components/material-asset-table/columns'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import { materialAssetStatusLabels } from '@/data/material-categories'
import type { Unit, UnitLevel } from '@/types'
import type { units } from '@/api/client'

const readOnlyMaterialStockColumns = buildMaterialStockColumns([]).filter(
	(c) => c.id !== 'actions'
)
const readOnlyMaterialAssetColumns = buildMaterialAssetColumns([]).filter(
	(c) => c.id !== 'actions'
)

function GroupUnits({ unitsMap }: { unitsMap: Map<UnitLevel, Unit[]> }) {
	const flatUnitsMapEntries = [...unitsMap.entries()]
	return flatUnitsMapEntries.map(([level, units], idx) => (
		<>
			<SelectGroup key={level}>
				<SelectLabel>{unitLevelLabels[level]}</SelectLabel>
				{units.map((u) => (
					<SelectItem key={u.id} value={u.alias}>
						{u.name}
					</SelectItem>
				))}
			</SelectGroup>
			{idx !== flatUnitsMapEntries.length - 1 && <SelectSeparator />}
		</>
	))
}

export default function BaseStatsDashboard() {
	const navigate = useNavigate({ from: Route.fullPath })
	const { unit: unitAliasParam } = Route.useSearch()
	const { user } = useAuth()
	const { data: units = [], isLoading: isLoadingUnits } = useUnitsData()

	const rootUnit = units.find((u) => !u.parent)
	const selectedAlias = unitAliasParam ?? user?.unit?.alias ?? rootUnit?.alias

	const { data: stats, isLoading: isLoadingStats } =
		useUnitStats(selectedAlias)

	const showRollupTabs = stats !== undefined && stats.unit.level !== 'squad'

	const { data: rollupStudents, isLoading: isLoadingRollupStudents } =
		useUnitStatsStudents(showRollupTabs ? selectedAlias : undefined)
	const { data: rollupStocks, isLoading: isLoadingRollupStocks } =
		useUnitStatsMaterialStocks(showRollupTabs ? selectedAlias : undefined)
	const { data: rollupAssets, isLoading: isLoadingRollupAssets } =
		useUnitStatsMaterialAssets(showRollupTabs ? selectedAlias : undefined)

	if (isLoadingUnits) {
		return <TableSkeleton />
	}

	const handleUnitChange = (alias: string) => {
		navigate({ search: (prev) => ({ ...prev, unit: alias }) })
	}

	const groupedUnits: Map<UnitLevel, units.Unit[]> = new Map()
	units.forEach((u) => {
		if (u.level === 'platoon' || u.level === 'squad') {
			return
		}

		if (!groupedUnits.has(u.level)) {
			groupedUnits.set(u.level, [u])
			return
		}

		groupedUnits.get(u.level)?.push(u)
	})

	const kpiCards = [
		{
			label: 'Tổng quân số',
			value: stats?.totalStudents ?? 0,
			icon: Users,
			color: 'text-blue-600',
			valueColor: 'text-blue-900'
		},
		{
			label: 'Nhà/khu nhà',
			value: stats?.buildingsCount ?? 0,
			icon: Building2,
			color: 'text-green-600',
			valueColor: 'text-green-900'
		},
		{
			label: 'Phòng',
			value: stats?.roomsCount ?? 0,
			icon: DoorOpen,
			color: 'text-amber-600',
			valueColor: 'text-amber-900'
		}
	]

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>
						Thống kê doanh trại
					</h2>
					<p className='text-muted-foreground'>
						Tổng hợp quân số, cơ sở vật chất và vũ khí/trang bị của
						đơn vị và toàn bộ đơn vị trực thuộc.
					</p>
				</div>

				<Select value={selectedAlias} onValueChange={handleUnitChange}>
					<SelectTrigger className='w-full md:w-[280px]'>
						<SelectValue placeholder='Chọn đơn vị' />
					</SelectTrigger>
					<SelectContent>
						<GroupUnits unitsMap={groupedUnits} />
					</SelectContent>
				</Select>
			</div>

			{selectedAlias === undefined && (
				<p className='text-muted-foreground'>
					Bạn chưa được phân công đơn vị nào để xem thống kê.
				</p>
			)}

			{selectedAlias !== undefined && isLoadingStats && <TableSkeleton />}

			{stats !== undefined && (
				<>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						{kpiCards.map(
							({
								label,
								value,
								icon: Icon,
								color,
								valueColor
							}) => (
								<Card key={label}>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											{label}
										</CardTitle>
										<Icon className={`h-5 w-5 ${color}`} />
									</CardHeader>
									<CardContent>
										<div
											className={`text-2xl font-bold ${valueColor}`}
										>
											{value}
										</div>
										<p className='text-xs text-muted-foreground'>
											{stats.unit.name}
											{' và đơn vị trực thuộc'}
										</p>
									</CardContent>
								</Card>
							)
						)}
					</div>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='h-5 w-5' />
								Cơ cấu đơn vị trực thuộc
							</CardTitle>
						</CardHeader>
						<CardContent>
							{Object.keys(stats.unitCounts).length === 0 ? (
								<p className='text-muted-foreground'>
									Đơn vị này không có đơn vị trực thuộc nào.
								</p>
							) : (
								<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
									{unitLevelOrder
										.filter(
											(level) =>
												stats.unitCounts[level] !==
												undefined
										)
										.map((level) => (
											<div
												key={level}
												className='rounded-lg border p-4 text-center'
											>
												<div className='text-2xl font-bold'>
													{stats.unitCounts[level]}
												</div>
												<div className='text-xs text-muted-foreground'>
													{unitLevelLabels[level]}
												</div>
											</div>
										))}
								</div>
							)}
						</CardContent>
					</Card>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Package className='h-5 w-5' />
									Vật tư sinh hoạt
								</CardTitle>
							</CardHeader>
							<CardContent>
								{stats.materialStockSummary.length === 0 ? (
									<p className='text-muted-foreground'>
										Chưa có vật tư sinh hoạt nào.
									</p>
								) : (
									<ul className='space-y-2'>
										{stats.materialStockSummary.map(
											(item) => (
												<li
													key={item.materialTypeId}
													className='flex items-center justify-between border-b pb-2 last:border-0'
												>
													<span>
														{item.materialTypeName}
													</span>
													<span className='font-semibold'>
														{item.totalQuantity}
													</span>
												</li>
											)
										)}
									</ul>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									Vũ khí/trang bị
								</CardTitle>
							</CardHeader>
							<CardContent>
								{stats.materialAssetSummary.length === 0 ? (
									<p className='text-muted-foreground'>
										Chưa có vũ khí/trang bị nào.
									</p>
								) : (
									<ul className='space-y-2'>
										{stats.materialAssetSummary.map(
											(item) => (
												<li
													key={item.status}
													className='flex items-center justify-between border-b pb-2 last:border-0'
												>
													<span>
														{materialAssetStatusLabels[
															item.status
														] ?? item.status}
													</span>
													<span className='font-semibold'>
														{item.count}
													</span>
												</li>
											)
										)}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>

					{showRollupTabs && (
						<Tabs defaultValue='students'>
							<TabsList>
								<TabsTrigger value='students'>
									Quân nhân
								</TabsTrigger>
								<TabsTrigger value='material-stocks'>
									Cơ sở vật chất
								</TabsTrigger>
								<TabsTrigger value='material-assets'>
									Vũ khí/trang bị
								</TabsTrigger>
							</TabsList>

							<TabsContent value='students'>
								{isLoadingRollupStudents ? (
									<TableSkeleton />
								) : (
									<DataTable
										placeholder='Không có quân nhân nào'
										columns={
											battalionStudentColumnsWithoutAction
										}
										data={rollupStudents ?? []}
										defaultColumnVisibility={
											defaultBirthdayColumnVisibility
										}
									/>
								)}
							</TabsContent>

							<TabsContent value='material-stocks'>
								{isLoadingRollupStocks ? (
									<TableSkeleton />
								) : (
									<DataTable
										placeholder='Không có vật tư sinh hoạt nào'
										columns={readOnlyMaterialStockColumns}
										data={rollupStocks ?? []}
									/>
								)}
							</TabsContent>

							<TabsContent value='material-assets'>
								{isLoadingRollupAssets ? (
									<TableSkeleton />
								) : (
									<DataTable
										placeholder='Không có vũ khí/trang bị nào'
										columns={readOnlyMaterialAssetColumns}
										data={rollupAssets ?? []}
									/>
								)}
							</TabsContent>
						</Tabs>
					)}
				</>
			)}
		</div>
	)
}
