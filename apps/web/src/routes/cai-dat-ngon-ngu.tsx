import LangPackManager from '@/components/lang-pack-manager'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/cai-dat-ngon-ngu')({
	component: RouteComponent
})

function RouteComponent() {
	const { t } = useTranslation('langPacks')

	return (
		<ProtectedRoute superAdminOnly>
			<SidebarInset>
				<div className='flex h-full flex-1 flex-col space-y-8 p-4 md:p-8'>
					<h2 className='text-2xl font-bold tracking-tight'>
						{t('title')}
					</h2>
					<LangPackManager />
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
