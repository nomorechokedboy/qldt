import type { Messages } from '../../types'
import type vi from '../vi/units'

const units: Messages<typeof vi> = {
	levels: {
		squad: 'Squad',
		platoon: 'Platoon',
		company: 'Company',
		battalion: 'Battalion',
		department: 'Department',
		regiment: 'Regiment',
		brigade: 'Brigade',
		division: 'Division',
		corps: 'Corps'
	},
	filters: {
		unit: 'Unit',
		rank: 'Rank',
		ethnic: 'Ethnicity',
		educationLevel: 'Education level',
		status: 'Status',
		statusPending: 'Unconfirmed',
		statusConfirmed: 'Confirmed'
	},
	select: {
		placeholder: 'Select a unit'
	},
	tabs: {
		students: 'Personnel',
		platoons: 'Platoons',
		squads: 'Squads',
		facilities: 'Facilities',
		weapons: 'Weapons/equipment',
		noStudentInfo: 'No personnel information yet.'
	},
	pageHeader: {
		subtitle: 'Manage personnel, facilities and weapons/equipment'
	},
	form: {
		name: 'Unit name',
		alias: 'Identifier (alias)',
		aliasExample: 'e.g. d1, c1',
		level: 'Unit level',
		levelPlaceholder: 'Select a unit level',
		parent: 'Parent unit',
		parentPlaceholder: 'Select a parent unit',
		noParent: 'None (root unit)',
		cancel: 'Cancel',
		cancelAlt: 'Cancel',
		loading: 'Loading...',
		add: 'Add',
		adding: 'Adding...',
		update: 'Update',
		updating: 'Updating...',
		addButton: 'Add unit',
		addTitle: 'Add unit form',
		createSuccess: 'Unit added successfully',
		createFailed: 'Failed to add the unit!',
		updateSuccess: 'Unit updated successfully',
		updateFailed: 'Failed to update the unit!',
		levelLocked: 'Only system administrators can change the unit level',
		parentLocked: 'Only system administrators can change the parent unit'
	},
	platoonForm: {
		addButton: 'Add platoon',
		title: 'Add platoon form',
		name: 'Platoon name',
		aliasExample: 'e.g. b1, b2',
		createSuccess: 'Platoon added successfully',
		createFailed: 'Failed to add the platoon!'
	},
	squadForm: {
		addButton: 'Add squad',
		title: 'Add squad form',
		name: 'Squad name',
		aliasExample: 'e.g. a1, a2',
		platoon: 'Parent platoon',
		platoonPlaceholder: 'Select a platoon',
		platoonRequired: 'Please select a platoon',
		createSuccess: 'Squad added successfully',
		createFailed: 'Failed to add the squad!'
	},
	commanders: {
		commander: 'Commander',
		deputyCommander: 'Deputy commander',
		politicalCommander: 'Political commissar',
		deputyPoliticalCommander: 'Deputy political commissar',
		platoonCommander: 'Platoon leader',
		squadCommander: 'Squad leader',
		choose: 'Select {{label}}',
		unassigned: 'Not assigned'
	},
	card: {
		rootBadge: 'Root unit',
		aliasLine: 'Identifier: {{alias}}',
		parentSuffix: ' · Under {{name}}',
		childCount: 'Subordinate units: {{count}}',
		manage: 'Manage unit',
		edit: 'Edit',
		delete: 'Delete',
		deleting: 'Deleting...',
		cancel: 'Cancel',
		editTitle: 'Edit unit',
		deleteTitle: 'Confirm unit deletion',
		deleteHeading: 'Delete this unit?',
		deleteConfirm:
			'Are you sure you want to delete the unit <name>{{name}}</name>?',
		irreversible: 'This action <strong>cannot be undone.</strong>',
		deleteSuccess: 'Unit "{{name}}" deleted successfully!',
		deleteFailed: 'Something went wrong while deleting the unit'
	},
	materialTables: {
		import: 'Import',
		manageTemplates: 'Manage templates',
		export: 'Export file',
		searchSupplyType: 'Search by supply type...',
		searchSerial: 'Search by serial number...',
		unit: 'Unit',
		supplyType: 'Supply type',
		assetType: 'Equipment type',
		condition: 'Condition',
		status: 'Status',
		room: 'Location',
		noRoom: 'No specific location'
	},
	rollup: {
		noStudents: 'No personnel',
		noSupplies: 'No supplies',
		noAssets: 'No weapons/equipment'
	},
	company: {
		facilitiesTitle: 'Facilities of {{name}}',
		noBuildings: 'This unit has no buildings yet.',
		suppliesTitle: 'Supplies',
		noSupplies: 'This unit has no supplies yet',
		weaponsTitle: 'Weapons/equipment of {{name}}',
		noWeapons: 'This unit has no weapons/equipment yet',
		squadListTitle: 'Squads of {{name}}',
		platoonListTitle: 'Platoons of {{name}}',
		needPlatoonFirst:
			'This company has no platoons yet. Create a platoon before adding a squad.',
		noSquads: 'This company has no squads yet.',
		noPlatoons: 'This company has no platoons yet.',
		studentListTitle: 'Personnel list',
		studentListSubtitle: 'This is the personnel list of {{name}}'
	},
	dashboard: {
		title: 'Unit statistics',
		subtitle:
			'Summary of personnel, facilities and weapons/equipment of the unit and all its subordinate units.',
		noUnitAssigned: 'You have not been assigned a unit to view statistics.',
		overview: 'Overview',
		details: 'Details',
		unknown: 'Unknown',
		quantity: 'Quantity',
		kpiTotalTroops: 'Total personnel',
		kpiBuildings: 'Buildings',
		kpiRooms: 'Rooms',
		kpiScope: '{{name}} and its subordinate units',
		troopSq: 'Officers',
		troopQncn: 'Professional soldiers',
		troopHsq: 'NCOs',
		troopBs: 'Soldiers',
		subordinateStructure: 'Subordinate unit structure',
		noSubordinates: 'This unit has no subordinate units.',
		troopStructure: 'Personnel structure',
		noTroopData: 'No personnel data yet.',
		troopStats: 'Personnel statistics',
		noTroopStats: 'No personnel statistics yet.',
		education: 'Education level',
		ethnic: 'Ethnicity',
		religion: 'Religion',
		politicalOrg: 'Youth Union/Party',
		birthPlace: 'Place of origin (Province/City)',
		supplies: 'Supplies',
		noSupplies: 'No supplies yet.',
		weapons: 'Weapons/equipment',
		noWeapons: 'No weapons/equipment yet.',
		weaponsByType: 'By weapon type',
		weaponType: 'Type',
		weaponTotal: 'Total',
		weaponInService: 'In service',
		weaponDamaged: 'Damaged',
		weaponLost: 'Lost',
		weaponRetired: 'Retired',
		weaponAssigned: 'Assigned to troopers',
		weaponHeldByUnit: 'Held by the unit',
		weaponsByUnit: 'Held by unit',
		weaponUnit: 'Unit',
		weaponHeldDirectly: '{{name}} (directly)',
		period: {
			title: 'Changes in the period',
			subtitle:
				'What happened in the selected period for the unit and its subordinate units.',
			kindLabel: 'Period type',
			yearLabel: 'Year',
			periodLabel: 'Period',
			month: 'Month',
			quarter: 'Quarter',
			year: 'Year',
			range: 'From {{from}} to {{to}}',
			loadFailed: 'Could not load the period figures.',
			weaponActivity: 'Weapons/equipment activity',
			assigned: 'Assigned to a trooper',
			unassigned: 'Returned to the unit',
			transferred: 'Transferred',
			damaged: 'Damaged',
			lost: 'Lost',
			retired: 'Retired',
			troopMovement: 'Troop movement',
			joined: 'New troopers (record created)',
			transferredIn: 'Transferred in',
			transferredOut: 'Transferred out',
			promoted: 'Promoted',
			discharged: 'Discharged',
			cpvAdmitted: 'Admitted to the Party',
			supplyMovement: 'Supplies transferred',
			supplyNote:
				'Only supplies moved between units by approved transfers; this is not a measure of consumption.',
			received: 'Received',
			sent: 'Sent',
			noSupplyMovement: 'No supplies were transferred in this period.'
		}
	},
	management: {
		title: 'Unit management',
		empty: 'No units yet.'
	},
	home: {
		title: 'Unit & Technical Equipment Management System',
		description:
			'A platform for managing unit information quickly, easily and accurately. You can add, edit, search and report on the personnel, supplies and technical equipment of the unit.',
		manageUnits: 'Manage units',
		unitStats: 'Unit statistics'
	},
	initialize: {
		firstTime: 'First-time setup',
		adminNotice:
			'This administrator account will have full access to the system and its data.',
		rootUnit: {
			title: 'Set up the unit',
			description:
				'The system has no units yet. Set up the root unit before you continue.',
			name: 'Unit name',
			alias: 'Identifier (alias)',
			aliasExample: 'e.g. d1',
			level: 'Unit level',
			levelPlaceholder: 'Select a unit level',
			submit: 'Set up unit',
			submitting: 'Setting up...',
			success: 'Unit set up successfully!',
			failed: 'Failed to set up the unit, something went wrong!'
		},
		admin: {
			title: 'Set up the administrator',
			description:
				'Set up your administrator account to start using the system',
			displayName: 'Full name',
			username: 'Username',
			password: 'Password',
			confirmPassword: 'Confirm password',
			submit: 'Set up',
			submitting: 'Setting up...',
			success: 'Administrator account set up successfully!',
			successDescription: 'You can now sign in to the system.',
			failed: 'Failed to set up the administrator account, something went wrong. Please contact a technician!',
			usernameRequired: 'Username is required',
			displayNameRequired: 'Full name is required',
			passwordMin: 'Password must be at least 8 characters',
			passwordUpper: 'Password must contain at least 1 uppercase letter',
			passwordLower: 'Password must contain at least 1 lowercase letter',
			passwordDigit: 'Password must contain at least 1 digit',
			confirmRequired: 'Please confirm your password',
			confirmMismatch: 'Passwords do not match'
		}
	},
	facilities: {
		common: {
			description: 'Description',
			cancel: 'Cancel',
			dismiss: 'Cancel',
			add: 'Add',
			adding: 'Adding...',
			save: 'Save',
			saving: 'Saving...',
			edit: 'Edit',
			delete: 'Delete',
			deleting: 'Deleting...'
		},
		building: {
			trigger: 'Add building',
			formTitle: 'Add building',
			name: 'Building name',
			namePlaceholder: 'e.g. Company 1 barracks',
			unit: 'Unit',
			pickUnit: 'Select a unit',
			created: 'Building added successfully',
			createFailed: 'Failed to add the building!',
			updated: 'Building updated successfully',
			updateFailed: 'Failed to update the building!',
			deleted: 'Building "{{name}}" deleted successfully!',
			deleteFailed: 'Something went wrong while deleting the building',
			roomCount: 'Rooms: {{count}}',
			manageRooms: 'Manage rooms',
			editTitle: 'Edit building',
			deleteDialogTitle: 'Confirm building deletion',
			deleteHeading: 'Delete this building?',
			deleteConfirm:
				'Are you sure you want to delete the building <name>{{name}}</name>?',
			irreversible: 'This action <b>cannot be undone.</b>',
			roomsTitle: 'Rooms - {{name}}'
		},
		room: {
			trigger: 'Add room',
			formTitle: 'Add room',
			name: 'Room name',
			namePlaceholder: 'e.g. Platoon leader room',
			type: 'Room type',
			typePlaceholder: 'e.g. dormitory, storage, command room',
			created: 'Room added successfully',
			createFailed: 'Failed to add the room!',
			updated: 'Room updated successfully',
			updateFailed: 'Failed to update the room!',
			deleteConfirm:
				'Are you sure you want to delete the room "{{name}}"?',
			deleted: 'Room deleted successfully',
			deleteFailed: 'Failed to delete the room!',
			empty: 'This building has no rooms yet.',
			inventoryHistory: 'Inventory history',
			editTitle: 'Edit room'
		}
	}
}

export default units
