import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { toastApiError } from '@/lib/api-error'

export default function InitializeRootUnitForm() {
	const { t } = useTranslation('units')
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
			toast.success(t('initialize.rootUnit.success'))
			navigate({ to: '/khoi-tao-qtv', replace: true })
		} catch (err) {
			console.error('Failed to create root unit:', err)
			toastApiError(t('initialize.rootUnit.failed'), err)
		}
	}

	return (
		<Card className='w-full max-w-md border-border/50 shadow-lg'>
			<CardHeader className='space-y-1 pb-6'>
				<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary'>
					<Building2 className='h-6 w-6 text-primary-foreground' />
				</div>
				<CardTitle className='text-center text-2xl font-semibold tracking-tight'>
					{t('initialize.rootUnit.title')}
				</CardTitle>
				<CardDescription className='text-center text-muted-foreground'>
					{t('initialize.rootUnit.description')}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='root-unit-name'>
							{t('initialize.rootUnit.name')}
						</Label>
						<Input
							id='root-unit-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='root-unit-alias'>
							{t('initialize.rootUnit.alias')}
						</Label>
						<Input
							id='root-unit-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder={t('initialize.rootUnit.aliasExample')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='root-unit-level'>
							{t('initialize.rootUnit.level')}
						</Label>
						<Select
							value={level}
							onValueChange={(value) =>
								setLevel(value as UnitLevel)
							}
						>
							<SelectTrigger id='root-unit-level'>
								<SelectValue
									placeholder={t(
										'initialize.rootUnit.levelPlaceholder'
									)}
								/>
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
							? t('initialize.rootUnit.submitting')
							: t('initialize.rootUnit.submit')}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
