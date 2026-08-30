import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useInitRootUnit } from '@/hooks/useInitRootUnit'
import { rootUnitLevelOptions } from '@/data/unit-levels'
import type { UnitLevel } from '@/types'

export default function InitializeRootUnitForm() {
	const navigate = useNavigate()
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')
	const [level, setLevel] = useState<UnitLevel>('company')
	const initRootUnitMutation = useInitRootUnit()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await initRootUnitMutation.mutateAsync({
				alias,
				name,
				level
			})
			toast.success('Khởi tạo đơn vị thành công!')
			navigate({ to: '/khoi-tao-qtv', replace: true })
		} catch (err) {
			console.error('Failed to create root unit:', err)
			toast.error('Khởi tạo đơn vị thất bại, đã có lỗi xảy ra!')
		}
	}

	return (
		<Card className='w-full max-w-md border-border/50 shadow-lg'>
			<CardHeader className='space-y-1 pb-6'>
				<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary'>
					<Building2 className='h-6 w-6 text-primary-foreground' />
				</div>
				<CardTitle className='text-center text-2xl font-semibold tracking-tight'>
					Khởi tạo đơn vị
				</CardTitle>
				<CardDescription className='text-center text-muted-foreground'>
					Hệ thống chưa có đơn vị nào. Hãy khởi tạo đơn vị gốc của
					doanh trại trước khi tiếp tục sử dụng.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='root-unit-name'>Tên đơn vị</Label>
						<Input
							id='root-unit-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='root-unit-alias'>
							Mã định danh (alias)
						</Label>
						<Input
							id='root-unit-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder='vd: d1'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='root-unit-level'>Cấp đơn vị</Label>
						<Select
							value={level}
							onValueChange={(value) =>
								setLevel(value as UnitLevel)
							}
						>
							<SelectTrigger id='root-unit-level'>
								<SelectValue placeholder='Chọn cấp đơn vị' />
							</SelectTrigger>
							<SelectContent>
								{rootUnitLevelOptions.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button
						type='submit'
						className='w-full'
						disabled={initRootUnitMutation.isPending}
					>
						{initRootUnitMutation.isPending
							? 'Đang khởi tạo...'
							: 'Khởi tạo đơn vị'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
