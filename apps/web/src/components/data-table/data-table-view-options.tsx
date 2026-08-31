import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>
}

export function DataTableViewOptions<TData>({
	table
}: DataTableViewOptionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					size='sm'
					className='ml-auto hidden h-8 lg:flex'
				>
					<Settings2 />
					Hiển thị các cột
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-[150px] no-scrollbar'>
				<DropdownMenuLabel>Đang được hiển thị</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter(
						(column) =>
							typeof column.accessorFn !== 'undefined' &&
							column.getCanHide()
					)
					.map((column) => {
						const label =
							column.columnDef.meta?.label ??
							(typeof column.columnDef.header === 'string'
								? column.columnDef.header
								: column.id)
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								checked={column.getIsVisible()}
								onCheckedChange={(value) =>
									column.toggleVisibility(!!value)
								}
								onSelect={(e) => e.preventDefault()}
							>
								{label}
							</DropdownMenuCheckboxItem>
						)
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
