import { useTranslation } from 'react-i18next'
import RefreshButton from '@/components/refresh-button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import type { DataTableExportHook } from '@/hooks/useDataTableExport'
import useDataTableExport from '@/hooks/useDataTableExport'
import { cn } from '@/lib/utils'
import type { FacetedFilterConfig } from '@/types'
import type { QueryObserverResult } from '@tanstack/react-query'
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type Table as TanStackTable,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table'
import { AxiosError } from 'axios'
import { type ComponentType, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { DataTablePagination } from './data-table-pagination'
import {
	DataTableToolbar,
	type DataTableToolbarProps
} from './data-table-toolbar'
import { BaseSchema } from './data/schema'
import { toastApiError } from '@/lib/api-error'

type ToolbarProps<TData> = Omit<DataTableToolbarProps<TData>, 'table'>

interface DataTableProps<TData, TValue> {
	cardClassName?: string
	cardComponent?: ComponentType<{ data: TData; index: number }>
	columns: ColumnDef<TData, TValue>[]
	facetedFilters?: Array<FacetedFilterConfig>
	data: TData[]
	defaultColumnVisibility?: VisibilityState
	defaultColumnFilters?: ColumnFiltersState
	defaultViewMode?: ViewMode
	toolbarProps?: ToolbarProps<TData>
	tableClassName?: string
	pagination?: boolean
	toolbarVisible?: boolean
	placeholder?: string
	// Adds a refresh button to the toolbar that calls this.
	onRefresh?: () => unknown
	onDeleteRows?: (
		ids: number[]
	) => Promise<QueryObserverResult<TData[], unknown>>

	onConfirmRows?: (
		ids: number[]
	) => Promise<QueryObserverResult<TData[], unknown>>
	renderToolbarActions?: (params: {
		table: TanStackTable<TData>
		exportHook: DataTableExportHook
	}) => React.ReactNode
	getRowId?: Parameters<typeof useReactTable<TData>>[0]['getRowId']
	withDynamicColsData?: boolean
	getRowClassName?: (data: TData, index: number) => string | undefined
}

type ViewMode = 'table' | 'card'

export function DataTable<TData, TValue>({
	cardClassName = '',
	cardComponent: CardComponent,
	columns,
	facetedFilters = [],
	data,
	defaultColumnVisibility = {},
	defaultColumnFilters = [],
	defaultViewMode = 'table',
	toolbarProps,
	tableClassName,
	pagination = true,
	toolbarVisible = true,
	placeholder,
	onRefresh,
	onDeleteRows,
	onConfirmRows,
	renderToolbarActions,
	getRowId,
	withDynamicColsData = true,
	getRowClassName
}: DataTableProps<TData, TValue>) {
	const { t } = useTranslation('table')
	const emptyText = placeholder ?? t('emptyTable')
	const [rowSelection, setRowSelection] = useState({})
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		defaultColumnVisibility
	)
	const [columnFilters, setColumnFilters] =
		useState<ColumnFiltersState>(defaultColumnFilters)
	const [sorting, setSorting] = useState<SortingState>([])
	const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
	const [isDeleting, setIsDeleting] = useState(false)
	const deleteDataToastId = `selection-toast-${useId()}`
	const toolbarFacetedFilter = toolbarProps?.facetedFilters

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters
		},
		enableRowSelection: !isDeleting,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		// Faceted unique-value maps are only ever read by
		// DataTableFacetedFilter, which only renders for columns listed in
		// `facetedFilters`. Computing them unconditionally means every
		// column's unique-value map gets rebuilt across every row on every
		// table recompute (e.g. on every `data` identity change), even for
		// callers that never use faceted filtering - for a table like the
		// student import review grid, where `data` gets a new reference on
		// every field edit, that's what made picking a select option feel
		// like it locked up the tab. TanStack Table falls back to an empty
		// Map when these options are omitted, so skipping them here is safe
		// for every caller that doesn't pass `facetedFilters`.
		getFacetedRowModel:
			facetedFilters.length > 0 ||
			(toolbarFacetedFilter?.length !== undefined &&
				toolbarFacetedFilter.length > 0)
				? getFacetedRowModel()
				: undefined,
		getFacetedUniqueValues:
			facetedFilters.length > 0 ||
			(toolbarFacetedFilter?.length !== undefined &&
				toolbarFacetedFilter.length > 0)
				? getFacetedUniqueValues()
				: undefined,
		getRowId
	})

	// Only create export hook
	const exportHook = useDataTableExport({
		table,
		isDynamic: withDynamicColsData
	})

	// Deletion logic remains in the component
	const selectedRows = table.getSelectedRowModel().rows

	const handleReset = () => {
		table.resetRowSelection()
		toast.dismiss(deleteDataToastId)
	}

	const handleDeleteSelected = async () => {
		if (!onDeleteRows) return

		const ids = selectedRows.map((r) => {
			const record = BaseSchema.parse(r.original)
			return record.id
		})

		try {
			setIsDeleting(true)
			if (confirm(t('selection.deleteConfirm'))) {
				await onDeleteRows(ids)
				toast.dismiss(deleteDataToastId)
				toast.success(t('selection.deleteSuccess'))
				table.resetRowSelection()
			} else {
				handleReset()
			}
		} catch (err) {
			toastApiError(t('selection.deleteFailed'), err)
			if (err instanceof AxiosError) {
				console.error('Http error: ', err.response?.data)
			}
		} finally {
			setIsDeleting(false)
		}
	}

	const handleConfirmSelected = async () => {
		if (!onConfirmRows) return

		const ids = selectedRows.map((r) => {
			const record = BaseSchema.parse(r.original)
			return record.id
		})

		try {
			setIsDeleting(true)
			if (confirm(t('selection.confirmConfirm'))) {
				await onConfirmRows(ids)
				toast.dismiss(deleteDataToastId)
				toast.success(t('selection.confirmSuccess'))
				table.resetRowSelection()
			} else {
				handleReset()
			}
		} catch (err) {
			toastApiError(t('selection.confirmFailed'), err)
			if (err instanceof AxiosError) {
				console.error('Http error: ', err.response?.data)
			}
		} finally {
			setIsDeleting(false)
		}
	}

	// Deletion toast effect
	useEffect(() => {
		if (!onDeleteRows && !onConfirmRows) return

		if (selectedRows.length === 0) {
			toast.dismiss(deleteDataToastId)
			return
		}

		toast('', {
			id: deleteDataToastId,
			duration: Number.POSITIVE_INFINITY,
			closeButton: false,
			position: 'bottom-center',
			description: t('selection.count', { count: selectedRows.length }),
			cancel: (
				<Button
					variant='outline'
					size='sm'
					onClick={handleReset}
					className='text-xs h-7 bg-transparent'
					disabled={isDeleting}
				>
					{t('selection.clear')}
				</Button>
			),
			action: (
				<div className='flex flex-col ml-4'>
					{onDeleteRows && (
						<Button
							variant='destructive'
							size='sm'
							onClick={handleDeleteSelected}
							className='text-xs h-7'
							disabled={isDeleting}
						>
							{t('selection.delete')}
						</Button>
					)}
					{onConfirmRows && (
						<Button
							variant='default'
							size='sm'
							onClick={handleConfirmSelected}
							className='text-xs h-7 mt-2'
							disabled={isDeleting}
						>
							{t('selection.confirm')}
						</Button>
					)}
				</div>
			)
		})
	}, [selectedRows, isDeleting, onDeleteRows, onConfirmRows, t])

	const renderTableView = () => {
		return (
			<div className={`rounded-md border bg-muted ${tableClassName}`}>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && 'selected'
									}
									className={cn(
										getRowClassName?.(
											row.original,
											row.index
										)
									)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'
								>
									{emptyText}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		)
	}

	const renderCardView = () => {
		if (!CardComponent) {
			return (
				<div className='text-center py-8 text-muted-foreground'>
					No card component provided
				</div>
			)
		}

		const rows = table.getRowModel().rows

		if (!rows?.length) {
			return (
				<div className='text-center py-8 text-muted-foreground'>
					{emptyText}
				</div>
			)
		}

		return (
			<div
				className={`grid gap-4 ${
					cardClassName || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
				}`}
			>
				{rows.map((row, index) => (
					<CardComponent
						key={row.id}
						data={row.original}
						index={index}
					/>
				))}
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			{toolbarVisible && (
				<DataTableToolbar
					table={table}
					facetedFilters={facetedFilters}
					onViewModeChange={setViewMode}
					{...toolbarProps}
					rightSection={
						<>
							{onRefresh && (
								<RefreshButton onRefresh={onRefresh} />
							)}
							{renderToolbarActions?.({
								table,
								exportHook
							})}
							{toolbarProps?.rightSection}
						</>
					}
				/>
			)}
			{viewMode === 'table' ? renderTableView() : renderCardView()}
			{pagination && <DataTablePagination table={table} />}
		</div>
	)
}
