import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogHeader,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/ui/dialog'
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
import { useCreateUnit } from '@/hooks/useCreateUnit'
import { getErrorMessage } from '@/lib/utils'
import type { Unit } from '@/types'
import {
	NO_COMMANDER,
	SingleCommanderField
} from '@/components/unit-commander-fields'

export interface SquadFormProps {
	platoonOptions: Unit[]
	defaultPlatoonId?: number
	onSuccess?: () => void
}

export default function SquadForm({
	platoonOptions,
	defaultPlatoonId,
	onSuccess
}: SquadFormProps) {
	const [open, setOpen] = useState(false)
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')
	const [platoonId, setPlatoonId] = useState<string>(
		defaultPlatoonId !== undefined ? String(defaultPlatoonId) : ''
	)
	const [commanderId, setCommanderId] = useState(NO_COMMANDER)

	const createUnitMutation = useCreateUnit()

	const resetForm = () => {
		setAlias('')
		setName('')
		setPlatoonId(
			defaultPlatoonId !== undefined ? String(defaultPlatoonId) : ''
		)
		setCommanderId(NO_COMMANDER)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!platoonId) {
			toast.error('Vui lòng chọn trung đội')
			return
		}

		try {
			await createUnitMutation.mutateAsync({
				alias,
				name,
				level: 'squad',
				parentId: Number(platoonId),
				commanderId:
					commanderId === NO_COMMANDER ? null : Number(commanderId)
			})
			toast.success('Thêm mới tiểu đội thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating squad:', err)
			toast.error(getErrorMessage(err, 'Thêm mới tiểu đội thất bại!'))
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
		>
			<DialogTrigger asChild>
				<Button disabled={platoonOptions.length === 0}>
					<Plus className='w-4 h-4 mr-2' />
					Thêm tiểu đội
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm tiểu đội</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='squad-name'>Tên tiểu đội</Label>
						<Input
							id='squad-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='squad-alias'>
							Mã định danh (alias)
						</Label>
						<Input
							id='squad-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder='vd: a1, a2'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='squad-platoon'>Thuộc trung đội</Label>
						<Select value={platoonId} onValueChange={setPlatoonId}>
							<SelectTrigger id='squad-platoon'>
								<SelectValue placeholder='Chọn trung đội' />
							</SelectTrigger>
							<SelectContent>
								{platoonOptions.map((p) => (
									<SelectItem key={p.id} value={String(p.id)}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<SingleCommanderField
						idPrefix='squad'
						label='Tiểu đội trưởng'
						value={commanderId}
						onChange={setCommanderId}
					/>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createUnitMutation.isPending}
						>
							{createUnitMutation.isPending
								? 'Đang thêm...'
								: 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
