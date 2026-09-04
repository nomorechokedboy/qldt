import { useState } from 'react'
import useUserData from '@/hooks/useUsers'
import type { User } from '@/types'
import { DataTable } from '../data-table'
import { baseUsersColumns } from './columns'
import { Button } from '../ui/button'
import { PlusIcon } from 'lucide-react'
import UserForm from './user-form'
import { UserTableContext } from './UserTableContext'

interface UserTableProps {
	enabledCreation?: boolean
}

export default function UserTable(_props: UserTableProps) {
	const { data: users = [], refetch: refetchUsers } = useUserData()

	// State for create form
	const [showCreateForm, setShowCreateForm] = useState(false)

	// State for edit form
	const [editingUser, setEditingUser] = useState<User | null>(null)
	const [showEditForm, setShowEditForm] = useState(false)

	// Handle add user button click
	const handleAddUser = () => {
		setEditingUser(null)
		setShowCreateForm(true)
	}

	// Handle edit user
	const handleEditUser = (user: User) => {
		setEditingUser(user)
		setShowEditForm(true)
	}

	// Handle form success (create or edit)
	const handleFormSuccess = () => {
		refetchUsers()
		setShowCreateForm(false)
		setShowEditForm(false)
	}

	return (
		<UserTableContext.Provider value={{ onEditUser: handleEditUser }}>
			<div className='space-y-4'>
				<DataTable
					data={users}
					columns={baseUsersColumns}
					withDynamicColsData={false}
					renderToolbarActions={() => (
						<div className='flex gap-2'>
							<Button onClick={handleAddUser}>
								<PlusIcon className='w-4 h-4 mr-2' />
								Thêm người dùng
							</Button>
						</div>
					)}
				/>

				{/* Create User Form */}
				{showCreateForm && (
					<UserForm
						open={showCreateForm}
						setOpen={setShowCreateForm}
						onSuccess={handleFormSuccess}
					/>
				)}
			</div>
		</UserTableContext.Provider>
	)
}
