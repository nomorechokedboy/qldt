import type { Messages } from '../../types'
import type vi from '../vi/admin'

const admin: Messages<typeof vi> = {
	common: {
		add: 'Add',
		adding: 'Adding...',
		cancel: 'Cancel',
		delete: 'Delete',
		details: 'Details',
		edit: 'Edit',
		loading: 'Loading...',
		loadingMore: 'Loading...',
		notProvided: 'Not provided',
		retryLater: 'Please try again later.',
		save: 'Save',
		saveShort: 'Save',
		saving: 'Saving...'
	},
	access: {
		deniedTitle: 'Access denied',
		deniedBody:
			'You do not have permission to view this content. Please contact an administrator if you need help.'
	},
	users: {
		title: 'User list',
		add: 'Add user',
		columns: {
			displayName: 'Full name',
			username: 'Username',
			unit: 'Unit',
			rank: 'Rank',
			position: 'Position',
			createdAt: 'Created on',
			actions: 'Actions'
		},
		fields: {
			displayName: 'Full name',
			username: 'Username',
			password: 'Password',
			unit: 'Unit',
			rank: 'Rank',
			position: 'Position',
			accountType: 'Account type',
			selectUnit: 'Select a unit',
			selectRank: 'Select a rank',
			selectPosition: 'Select a position'
		},
		accountTypes: {
			admin: 'Administrator account',
			regular: 'Regular account'
		},
		actions: { assignRoles: 'Assign roles' },
		info: {
			title: 'User information',
			adminBadge: 'Administrator',
			regularUser: 'User'
		},
		create: {
			title: 'Add user',
			success: 'User added successfully',
			failed: 'Failed to add the user'
		},
		edit: {
			title: 'Edit user',
			newPassword: 'New password (leave blank to keep the current one)',
			newPasswordPlaceholder: 'Enter a new password',
			confirmPassword: 'Confirm password',
			success: 'User updated successfully',
			failed: 'Failed to update the user'
		},
		delete: {
			confirm:
				'Are you sure you want to delete this user? This action cannot be undone.',
			success: 'Deleted successfully!',
			failed: 'Failed to delete!'
		},
		unlock: {
			title: 'Unlock sign-in',
			action: 'Unlock',
			tooltip:
				'This account is locked after too many wrong passwords. Click to unlock.',
			description:
				'The account <username>{{username}}</username> is locked because of too many wrong password attempts. Are you sure you want to unlock it now?',
			success: 'Sign-in unlocked for the user',
			failed: 'Failed to unlock sign-in'
		},
		validation: {
			displayNameRequired: 'Full name is required',
			usernameRequired: 'Username is required',
			passwordRequired: 'Password is required',
			unitRequired: 'Unit is required',
			passwordMin: 'Password must be at least 6 characters'
		}
	},
	assignRoles: {
		title: 'Assign roles to {{name}}',
		empty: 'There are no roles in the system yet',
		save: 'Save changes',
		success: 'Roles updated successfully',
		failed: 'Something went wrong while updating roles'
	},
	roles: {
		searchPlaceholder: 'Search...',
		empty: 'No roles yet...',
		permissionCount: '{{count}} permission(s)',
		userCount: '{{count}} user(s)',
		fields: { name: 'Role name', description: 'Description' },
		create: {
			trigger: 'Create role',
			title: 'Create a new role',
			action: 'Create',
			loading: 'Creating...',
			success: 'Role created successfully!',
			failed: 'Failed to create the role.'
		},
		update: {
			title: 'Edit role',
			action: 'Save',
			loading: 'Saving...',
			success: 'Role updated successfully!',
			failed: 'Failed to update the role.'
		},
		delete: {
			dialogTitle: 'Confirm role deletion',
			heading: 'Delete this role?',
			confirm:
				'Are you sure you want to delete the role <name>{{name}}</name>?',
			irreversible: 'This action <b>cannot be undone.</b>',
			cancel: 'Cancel',
			action: 'Delete',
			deleting: 'Deleting...',
			success: 'Role deleted successfully!',
			failed: 'Failed to delete the role.'
		}
	},
	permissions: {
		searchPlaceholder: 'Search permissions...',
		createTrigger: 'Create permission',
		empty: 'No permissions yet',
		usedBy: 'Used by {{count}} role(s)',
		fields: {
			name: 'Permission name',
			displayName: 'Display name',
			description: 'Description',
			resource: 'Resource',
			action: 'Action'
		},
		create: {
			success: 'Created successfully!',
			failed: 'Failed to create.'
		},
		assign: {
			trigger: 'Permissions',
			title: 'Assign permissions to the role {{name}}',
			description: 'Choose the permissions this role will have'
		}
	},
	positions: {
		title: 'Positions',
		searchPlaceholder: 'Search by position name...',
		empty: 'No positions yet',
		levels: {
			squad: 'Squad',
			platoon: 'Platoon',
			company: 'Company',
			battalion: 'Battalion',
			brigade: 'Brigade',
			regiment: 'Regiment',
			division: 'Division'
		},
		columns: {
			priority: 'Priority',
			code: 'Position code',
			name: 'Position name'
		},
		fields: {
			code: 'Position code',
			codePlaceholder: 'e.g. tlts, nvqk, y tá',
			name: 'Position name',
			namePlaceholder: 'e.g. Operations assistant',
			priority:
				'Priority order (the smaller the number, the higher it ranks)',
			hsq: 'NCO position (HSQ)'
		},
		create: {
			trigger: 'Add position',
			title: 'Add position',
			success: 'Position added successfully',
			failed: 'Failed to add the position!'
		},
		update: {
			title: 'Edit position',
			success: 'Position updated successfully',
			failed: 'Failed to update the position!'
		},
		delete: {
			confirm:
				'Are you sure you want to delete the position "{{name}}"? This action cannot be undone.',
			success: 'Position deleted successfully!',
			failed: 'Failed to delete the position!'
		}
	},
	audit: {
		title: 'Activity log',
		allResources: 'All resources',
		allActions: 'All actions',
		empty: 'No log entries',
		view: 'View',
		previous: 'Previous',
		next: 'Next',
		pagination: 'Page {{page}} / {{totalPages}} ({{total}} records)',
		detailTitle: 'Log details',
		columns: {
			time: 'Time',
			actor: 'Performed by',
			resource: 'Resource',
			action: 'Action'
		},
		resources: {
			students: 'Personnel',
			material_assets: 'Weapons/equipment',
			material_types: 'Material catalog',
			material_stocks: 'Material stock',
			buildings: 'Buildings',
			rooms: 'Rooms',
			units: 'Units',
			roles: 'Roles',
			permissions: 'Permissions',
			users: 'Users',
			user_roles: 'User role assignments',
			transfer_requests: 'Transfer requests',
			inventory_sessions: 'Inventory sessions'
		},
		actions: {
			create: 'Create',
			update: 'Update',
			delete: 'Delete',
			approve: 'Approve',
			reject: 'Reject'
		}
	},
	profile: {
		title: 'Profile',
		view: {
			editInfo: 'Edit information',
			personal: 'Personal information',
			login: 'Sign-in information',
			system: 'System information',
			createdAt: 'Created on',
			updatedAt: 'Updated on'
		},
		edit: {
			title: 'Edit personal information',
			success: 'Information updated successfully',
			failed: 'Failed to update the information'
		},
		password: {
			title: 'Change password',
			current: 'Current password',
			currentPlaceholder: 'Enter your current password',
			new: 'New password',
			newPlaceholder: 'Enter a new password (at least 6 characters)',
			confirm: 'Confirm new password',
			confirmPlaceholder: 'Re-enter the new password',
			success: 'Password changed. Please sign in again.',
			incorrect: 'The current password is incorrect',
			failed: 'Failed to change the password'
		},
		validation: {
			prevPasswordRequired: 'Current password is required',
			passwordMin: 'New password must be at least 6 characters',
			confirmRequired: 'Please confirm the password',
			passwordMismatch: 'The passwords do not match'
		}
	},
	notifications: {
		today: 'Today',
		yesterday: 'Yesterday',
		empty: 'No notifications yet',
		noMore: 'No more notifications',
		loadFailed: 'Failed to load notifications'
	}
}

export default admin
