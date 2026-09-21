import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useCreateUnit } from '@/hooks/useCreateUnit'
import {
	NO_COMMANDER,
	SingleCommanderField
} from '@/components/unit-commander-fields'
import { toastApiError } from '@/lib/api-error'

export interface PlatoonFormProps {
	companyId: number
	onSuccess?: () => void
}

export default function PlatoonForm({
	companyId,
	onSuccess
}: PlatoonFormProps) {
	const { t } = useTranslation('units')
	const [open, setOpen] = useState(false)
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')
	const [commanderId, setCommanderId] = useState(NO_COMMANDER)

	const createUnitMutation = useCreateUnit()

	const resetForm = () => {
		setAlias('')
		setName('')
		setCommanderId(NO_COMMANDER)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createUnitMutation.mutateAsync({
				alias,
				name,
				level: 'platoon',
				parentId: companyId,
				commanderId:
					commanderId === NO_COMMANDER ? null : Number(commanderId)
			})
			toast.success(t('platoonForm.createSuccess'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating platoon:', err)
			toastApiError(t('platoonForm.createFailed'), err)
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
					{t('platoonForm.addButton')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('platoonForm.title')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='platoon-name'>
							{t('platoonForm.name')}
						</Label>
						<Input
							id='platoon-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='platoon-alias'>{t('form.alias')}</Label>
						<Input
							id='platoon-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder={t('platoonForm.aliasExample')}
							required
						/>
					</div>

					<SingleCommanderField
						idPrefix='platoon'
						label={t('commanders.platoonCommander')}
						value={commanderId}
						onChange={setCommanderId}
					/>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('form.cancelAlt')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createUnitMutation.isPending}
						>
							{createUnitMutation.isPending
								? t('form.adding')
								: t('form.add')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
