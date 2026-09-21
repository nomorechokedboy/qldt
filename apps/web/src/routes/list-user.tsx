import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset } from '@/components/ui/sidebar'
import UserTable from '@/components/user-table'
import type { StudentQueryParams } from '@/types'
import useUnitsData from '@/hooks/useUnitsData'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/list-user')({
	component: RouteComponent
})

function RouteComponent() {
	const { t } = useTranslation('admin')
	// const [studentParams, setStudentParams] =
	// 	React.useState<StudentQueryParams>({
	// 		isEthnicMinority: true
	// 	})
	return (
		<ProtectedRoute superAdminOnly>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<div className='flex items-center justify-between space-y-2'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight'>
								{t('users.title')}
							</h2>
						</div>
					</div>
					<div className='mt-4'>
						<UserTable />
					</div>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
