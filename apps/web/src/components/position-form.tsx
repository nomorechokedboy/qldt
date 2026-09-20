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
import { Checkbox } from '@/components/ui/checkbox'
import { useCreatePosition } from '@/hooks/useCreatePosition'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export interface PositionFormProps {
	level: string
	onSuccess?: () => void
}

export default function PositionForm({ level, onSuccess }: PositionFormProps) {
	const { t } = useTranslation('admin')
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')
	const [name, setName] = useState('')
	const [priority, setPriority] = useState('')
	const [isHsq, setIsHsq] = useState(false)

	const createMutation = useCreatePosition()

	const resetForm = () => {
		setCode('')
		setName('')
		setPriority('')
		setIsHsq(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				level,
				code,
				name,
				priority: Number(priority),
				group: isHsq ? 'HSQ' : null
			})
			toast.success(t('positions.create.success'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating position:', err)
			toast.error(getErrorMessage(err, t('positions.create.failed')))
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
				<Button>
					<Plus className='w-4 h-4 mr-2' />
					{t('positions.create.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('positions.create.title')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='position-code'>
							{t('positions.fields.code')}
						</Label>
						<Input
							id='position-code'
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder={t('positions.fields.codePlaceholder')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='position-name'>
							{t('positions.fields.name')}
						</Label>
						<Input
							id='position-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('positions.fields.namePlaceholder')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='position-priority'>
							{t('positions.fields.priority')}
						</Label>
						<Input
							id='position-priority'
							type='number'
							value={priority}
							onChange={(e) => setPriority(e.target.value)}
							required
						/>
					</div>

					<div className='flex items-center gap-2'>
						<Checkbox
							id='position-hsq'
							checked={isHsq}
							onCheckedChange={(value) => setIsHsq(!!value)}
						/>
						<Label htmlFor='position-hsq'>
							{t('positions.fields.hsq')}
						</Label>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('common.cancel')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createMutation.isPending}
						>
							{createMutation.isPending
								? t('common.adding')
								: t('common.add')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
