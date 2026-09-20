import type { Messages } from '../../types'
import type vi from '../vi/table'

const table: Messages<typeof vi> = {
	columns: {
		unit: 'Unit',
		fullName: 'Full name',
		yearOfBirth: 'Year of birth',
		dob: 'Date of birth',
		birthPlace: 'Place of origin',
		address: 'Residence',
		enlistmentPeriod: 'Enlistment period',
		graduated: 'Graduated',
		major: 'Major',
		phone: 'Phone number',
		policyGroup: 'Policy beneficiary group',
		politicalOrg: 'Youth Union / Party',
		hcyuDate: 'Youth Union join date',
		cpvId: 'Party card number',
		cpvDate: 'Party join date',
		previousPosition: 'Previous position',
		religion: 'Religion',
		schoolName: 'School name',
		shortcoming: 'Shortcomings',
		talent: 'Talents',
		rank: 'Rank',
		position: 'Position',
		previousUnit: 'Previous unit',
		ethnic: 'Ethnicity',
		education: 'Education',
		educationLevel: 'Education level',
		fatherName: "Father's name",
		fatherJob: "Father's occupation",
		fatherPhone: "Father's phone",
		motherName: "Mother's name",
		motherJob: "Mother's occupation",
		motherPhone: "Mother's phone",
		status: 'Status',
		activityStatus: 'Condition',
		familyCircumstances: 'Family circumstances',
		married: 'Married',
		spouseName: "Spouse's name",
		spouseJob: "Spouse's occupation",
		spousePhone: "Spouse's phone",
		familySize: 'Household size',
		familyBackground: 'Family background',
		achievement: 'Achievements',
		discipline: 'Disciplinary record',
		children: 'Children',
		studentId: 'Student ID'
	},
	values: {
		yes: 'Yes',
		no: 'No',
		cpvMember: 'Party member',
		hcyuMember: 'Youth Union member',
		confirmed: 'Confirmed',
		pending: 'Unconfirmed'
	},
	emptyTable: 'No data',
	toolbar: {
		reset: 'Reset'
	},
	viewOptions: {
		trigger: 'Columns',
		label: 'Visible columns'
	},
	columnHeader: {
		search: 'Search...',
		sortAsc: 'A to Z',
		sortDesc: 'Z to A',
		hide: 'Hide column'
	},
	pagination: {
		selected: '{{selected}} of {{total}} row(s) selected.',
		rowsPerPage: 'Rows per page',
		page: 'Page {{page}} of {{total}}',
		first: 'Go to first page',
		previous: 'Go to previous page',
		next: 'Go to next page',
		last: 'Go to last page'
	},
	selection: {
		deleteConfirm:
			'Are you sure you want to delete the selected items? This cannot be undone!',
		deleteSuccess: 'Deleted successfully!',
		deleteFailed: 'Could not delete the data!',
		confirmConfirm:
			'Are you sure you want to confirm the selected records? \nYou cannot edit them after they are confirmed!',
		confirmSuccess: 'Confirmed successfully!',
		confirmFailed: 'Could not confirm the records!',
		count: '{{count}} selected',
		clear: 'Clear selection',
		delete: 'Delete data',
		confirm: 'Confirm personnel records'
	},
	rowActions: {
		openMenu: 'Open menu',
		details: 'Details',
		delete: 'Delete',
		deleteConfirm:
			'Are you sure you want to delete this person? This cannot be undone.',
		deleteSuccess: 'Deleted successfully!',
		deleteFailed: 'Could not delete the data!',
		dialogTitle: 'Personnel record',
		dialogDescription: 'Record of {{name}}.'
	},
	cells: {
		empty: 'No information yet...',
		updateSuccess: 'Personnel record updated',
		updateFailed: 'Could not update the personnel record!'
	},
	error: {
		title: 'Something went wrong',
		retry: 'Try again'
	},
	toggleInput: {
		clickToEdit: 'Click to edit...',
		search: 'Search...',
		noOptions: 'No options found.'
	},
	studentTable: {
		import: 'Import',
		manageTemplates: 'Manage templates',
		exportData: 'Export data',
		exportRoster: 'Export unit roster',
		exportFile: 'Export file'
	},
	facetedFilter: {
		selected: '{{count}} selected',
		noResults: 'No results found.',
		clear: 'Clear filters'
	}
}

export default table
