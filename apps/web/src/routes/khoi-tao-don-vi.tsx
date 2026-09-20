import InitializeRootUnitForm from '@/components/initialize-root-unit-form'
import useIsInitRootUnit from '@/hooks/useIsInitRootUnit'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/khoi-tao-don-vi')({
	component: RouteComponent
})

function RouteComponent() {
	const { t } = useTranslation('units')
	const { data, isLoading } = useIsInitRootUnit()

	if (isLoading) {
		return null
	}

	if (data?.initialized === true) {
		return <Navigate to='/khoi-tao-qtv' replace={true} />
	}

	return (
		<main className='min-h-screen flex flex-col items-center justify-center bg-background p-4'>
			<div className='w-full max-w-md space-y-6'>
				<div className='text-center space-y-2'>
					<p className='text-xs font-medium uppercase tracking-widest text-muted-foreground'>
						{t('initialize.firstTime')}
					</p>
				</div>
				<InitializeRootUnitForm />
			</div>
		</main>
	)
}
