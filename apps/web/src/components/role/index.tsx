import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Shield } from 'lucide-react'
import PermissionsModal from '@/components/permission/modals'
import RoleCardSkeleton from './skeleton'
import { ErrorState } from '@/components/error-state'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DeleteRole, GetRoles } from '@/api'
import CreateRoleForm from './create-form'
import { toast } from 'sonner'
import UpdateRoleForm from './update-form'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '../ui/dialog'
import { DialogClose, DialogTrigger } from '@radix-ui/react-dialog'
import { Trans, useTranslation } from 'react-i18next'

export default function RolesTab() {
	const { t } = useTranslation('admin')
	const {
		data: roles = [],
		isLoading,
		error,
		refetch: refetchRoles
	} = useQuery({ queryKey: ['roles'], queryFn: GetRoles })
	const [searchQuery, setSearchQuery] = useState('')
	const { mutateAsync: deleteRole, isPending: isDeleteRolePending } =
		useMutation({
			mutationFn: DeleteRole,
			onSuccess: () => {
				toast.success(t('roles.delete.success'))
				refetchRoles()
			},
			onError: (err) => {
				console.error('DeleteRole error', err)

				toastApiError(t('roles.delete.failed'), err)
			}
		})

	const filteredRoles = roles.filter(
		(role) =>
			role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			role.description.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const handleDeleteRole = (id: number) => {
		deleteRole([id])
	}

	const handleRetry = () => {
		refetchRoles()
	}

	if (error) {
		return <ErrorState error={error} onRetry={handleRetry} />
	}

	return (
		<div className='space-y-6 p-8'>
			{/* Header with Search and Create Button */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<Input
					placeholder={t('roles.searchPlaceholder')}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className='sm:max-w-xs'
				/>
				<CreateRoleForm />
			</div>

			{/* Roles Grid */}
			{isLoading ? (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{Array.from({ length: 6 }).map((_, i) => (
						<RoleCardSkeleton key={i} />
					))}
				</div>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{filteredRoles.map((role) => (
						<Card key={role.id} className='flex flex-col'>
							<CardHeader>
								<CardTitle className='text-lg'>
									{role.name}
								</CardTitle>
								<CardDescription>
									{role.description}
								</CardDescription>
							</CardHeader>
							<CardContent className='flex-1 space-y-4'>
								{/* Permission Badges */}
								<div className='space-y-2'>
									<p className='text-xs font-semibold text-muted-foreground'>
										{t('roles.permissionCount', {
											count: role.permissions.length
										})}
									</p>
									<div className='flex flex-wrap gap-1'>
										{role.permissions
											.slice(0, 3)
											.map((permission) => (
												<Badge
													key={permission.id}
													variant='secondary'
													className='text-xs'
												>
													{permission.key}
												</Badge>
											))}
										{role.permissions.length > 3 && (
											<Badge
												variant='secondary'
												className='text-xs'
											>
												+{role.permissions.length - 3}
											</Badge>
										)}
									</div>
								</div>

								{/* User Count */}
								<div className='text-sm text-muted-foreground'>
									{t('roles.userCount', {
										count: role.userCount
									})}
								</div>

								{/* Actions */}
								<div className='flex gap-2 pt-2'>
									<PermissionsModal role={role} />

									<UpdateRoleForm
										id={role.id}
										name={role.name}
										description={role.description}
									/>

									<Dialog>
										<DialogTrigger asChild>
											<Button
												variant='outline'
												size='sm'
												disabled={isDeleteRolePending}
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</DialogTrigger>
										<DialogContent className='max-w-md max-h-1/4'>
											<DialogTitle className='sr-only'>
												{t('roles.delete.dialogTitle')}
											</DialogTitle>
											<div className='flex flex-col gap-4'>
												<div className='font-semibold text-lg text-center'>
													{t('roles.delete.heading')}
												</div>
												<div className='text-center text-muted-foreground'>
													<Trans
														t={t}
														i18nKey='roles.delete.confirm'
														values={{
															name: role.name
														}}
														components={{
															name: (
																<b className='text-red-600' />
															)
														}}
													/>
													<p>
														<Trans
															t={t}
															i18nKey='roles.delete.irreversible'
															components={{
																b: <b />
															}}
														/>
													</p>
												</div>
												<DialogFooter className='flex justify-end gap-2 mt-4'>
													<DialogClose asChild>
														<Button
															variant='outline'
															type='button'
															className='px-4 py-2 rounded-lg border'
															disabled={
																isDeleteRolePending
															}
														>
															{t(
																'roles.delete.cancel'
															)}
														</Button>
													</DialogClose>
													<Button
														type='button'
														className='px-4 py-2 rounded-lg bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50'
														onClick={() =>
															handleDeleteRole(
																role.id
															)
														}
														disabled={
															isDeleteRolePending
														}
													>
														{isDeleteRolePending
															? t(
																	'roles.delete.deleting'
																)
															: t(
																	'roles.delete.action'
																)}
													</Button>
												</DialogFooter>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Empty State */}
			{filteredRoles.length === 0 && !isLoading && (
				<Card className='border-dashed'>
					<CardContent className='flex flex-col items-center justify-center py-12'>
						<Shield className='mb-4 h-8 w-8 text-muted-foreground' />
						<p className='text-muted-foreground'>
							{t('roles.empty')}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
