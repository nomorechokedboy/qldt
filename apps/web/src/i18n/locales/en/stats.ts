import type { Messages } from '../../types'
import type vi from '../vi/stats'

const stats: Messages<typeof vi> = {
	politicalOrg: {
		cpv: 'Party',
		hcyu: 'Youth Union'
	},
	charts: {
		byUnit: 'Personnel education level by unit & class',
		total: 'Total',
		count: 'Count',
		ethnic: 'Ethnicity distribution',
		religion: 'Religion distribution',
		education: 'Education level distribution',
		politicalOrg: 'Youth Union / Party distribution'
	},
	report: {
		totalPersonnelValue: 'Total personnel: {{count}}',
		totalPersonnel: 'Total personnel',
		wholeUnit: 'Entire unit',
		unitCount: 'Number of units',
		units: 'Units',
		classCount: 'Number of classes',
		squads: 'Squads',
		tabs: {
			overview: 'Overview',
			detailed: 'Details',
			charts: 'Charts'
		},
		overviewTitle: 'Overview statistics by unit',
		exportTitle: 'Export report',
		exportPdf: 'Export PDF',
		exportExcel: 'Export Excel file (.xlsx)',
		exportFailed: 'Could not export the file, an error occurred!',
		inDevelopment: 'Feature under development'
	},
	table: {
		title: 'Detailed statistics table',
		unit: 'Unit',
		rankGroup: 'Rank group',
		ethnic: 'Ethnicity',
		religion: 'Religion',
		education: 'Education',
		partyMember: 'Party members',
		youthMember: 'Youth Union members',
		family: 'Family',
		note: 'Notes',
		fieldOfficer: 'Field officers',
		juniorOfficer: 'Junior officers',
		proSoldierCommander: 'Professional soldiers (managers)',
		proSoldier: 'Professional soldiers',
		revolution: 'Revolutionary',
		military: 'Military/civilian',
		abroad: 'Abroad',
		total: 'Total'
	},
	exportDialog: {
		title: 'Export data',
		description: 'Fill in the required information to export the data',
		titleLabel: 'Statistics file title',
		titleRequired: 'The statistics file title is required',
		filenameLabel: 'File name',
		filenameRequired: 'The file name is required',
		cancel: 'Cancel',
		confirm: 'Confirm',
		exporting: 'Exporting file...'
	},
	period: {
		month: 'Month {{month}}',
		quarter: 'Quarter {{quarter}}',
		unit: 'Unit'
	},
	birthday: {
		heading: 'Personnel with birthdays in',
		headingWeek: 'Personnel with birthdays this week',
		descriptionMonth:
			'Personnel of the company with birthdays in month {{month}}',
		descriptionQuarter:
			'Personnel of the company with birthdays in quarter {{quarter}}',
		descriptionWeek: 'Personnel of the company with birthdays this week',
		tabs: {
			week: 'Week',
			month: 'Month',
			quarter: 'Quarter'
		}
	},
	cpv: {
		heading: 'Personnel about to become full Party members in',
		headingWeek: 'Personnel about to become full Party members this week',
		descriptionMonth:
			'Personnel of the company about to become full Party members in month {{month}}',
		descriptionQuarter:
			'Personnel of the company about to become full Party members in quarter {{quarter}}',
		descriptionWeek:
			'Personnel of the company about to become full Party members this week'
	},
	datePicker: {
		placeholder: 'Day/month/year',
		formatHint: 'Enter {{label}} in the format dd/mm/yyyy',
		invalid: 'Please enter a valid date'
	},
	dateRange: {
		placeholder: 'Select a date range',
		clear: 'Clear date range'
	},
	routes: {
		cpvTitle: 'Personnel who are Party members',
		hcyuTitle: 'Personnel who are Youth Union members',
		religionTitle: 'Personnel with a religion',
		hardshipTitle: 'Personnel in difficult circumstances',
		ethnicMinorityTitle: 'Ethnic minority personnel',
		pickHint: 'Choose a battalion, company and class to view the roster',
		battalion: 'Battalion',
		company: 'Company',
		class: 'Class',
		squad: 'Squad',
		choose: '--Select {{label}}--',
		chooseBattalion: '--Select battalion--',
		chooseCompany: '--Select company--',
		chooseClass: '--Select class--',
		filter: 'Filter',
		tabWeek: 'Week',
		tabMonth: 'Month',
		tabQuarter: 'Quarter'
	}
}

export default stats
