import type { Messages } from '../../types'
import type vi from '../vi/io'

const io: Messages<typeof vi> = {
	importDialog: {
		title: 'Import personnel list',
		description:
			'Upload an Excel or CSV file to add many personnel at once.',
		messages: {
			refErrors:
				'The file was read, but {{count}} row(s) contain reference errors (invalid unit/position).',
			readFormat:
				'Could not read the file. Please check the file format.',
			readRetry: 'Could not read the file. Please try again.',
			invalidType: 'Please choose a CSV or Excel file (.xlsx, .xls)',
			noFile: 'Please choose a file to import',
			fixRefErrors:
				'Please fix the rows with reference errors before importing.',
			processing: 'Processing file...',
			done: 'Import complete! Succeeded: {{success}}/{{total}} personnel',
			failed: 'Import error: {{message}}'
		},
		results: {
			title: 'Import results:',
			success: 'Succeeded',
			errors: 'Errors',
			total: 'Total',
			details: 'Error details:',
			row: 'Row {{row}}: {{message}}'
		},
		actions: {
			close: 'Close',
			cancel: 'Cancel',
			importing: 'Importing...',
			confirm: 'Confirm & Import',
			fixErrorsTooltip: 'Please fix the rows with errors before importing'
		},
		upload: {
			steps: {
				download: 'Download the template file',
				fill: 'Fill in the personnel details following the template',
				upload: 'Upload the file and press Import'
			},
			template: {
				title: 'Excel template',
				hint: 'Download it to get the exact data structure',
				download: 'Download'
			},
			choose: 'Choose a file to import',
			another: 'Choose another file',
			dropBefore: 'Drag and drop a file here or',
			dropLink: 'choose a file',
			supported: 'Supports CSV, Excel (.xlsx, .xls)'
		},
		review: {
			title: 'Preview import data',
			hint: 'Review and edit the data below before importing it into the system',
			another: 'Choose another file',
			total: 'Total:',
			valid: 'Valid: {{count}}',
			errors: 'Errors: {{count}}',
			empty: 'No data',
			help: 'See the "{{status}}" column of each row to find which rows still have errors - hover the "{{error}}" label for details. Birthplace/residence errors can be fixed right in the table - use the "{{columns}}" button above to show the matching Province/City and Ward/Commune columns.'
		},
		columns: {
			status: 'Status',
			fullName: 'Full name',
			studentId: 'Personnel ID',
			unit: 'Unit',
			position: 'Position',
			rank: 'Rank',
			dob: 'Date of birth',
			phone: 'Phone',
			activityStatus: 'Status',
			birthProvince: 'Province/City (Birthplace)',
			birthWard: 'Ward/Commune (Birthplace)',
			birthDetail: 'Details (Birthplace)',
			addressProvince: 'Province/City (Residence)',
			addressWard: 'Ward/Commune (Residence)',
			addressDetail: 'Details (Residence)'
		},
		placeholders: {
			unit: '-- Select unit --',
			position: '-- Select position --',
			activityStatus: '-- Select status --',
			province: '-- Select province/city --',
			ward: '-- Select ward/commune --'
		},
		rowStatus: { error: 'Error', ok: 'OK' },
		cells: {
			search: 'Search...',
			notFound: 'Not found.',
			pickDate: 'Pick a date'
		}
	},
	studentReview: {
		title: 'Review the entered information',
		personal: 'Personal information',
		military: 'Military information',
		family: 'Family information',
		fields: {
			fullName: 'Full name:',
			birthPlace: 'Birthplace:',
			address: 'Residence:',
			ethnic: 'Ethnicity:',
			religion: 'Religion:',
			educationLevel: 'Education level:',
			schoolName: 'School name:',
			major: 'Major:',
			phone: 'Phone:',
			dob: 'Date of birth:',
			enlistmentPeriod: 'Enlistment date:',
			previousUnit: 'Previous unit:',
			previousPosition: 'Position at previous unit:',
			policyBeneficiaryGroup: 'Policy group:',
			name: 'Name:',
			phoneNumber: 'Phone:',
			job: 'Occupation:'
		},
		father: 'Father',
		mother: 'Mother'
	},
	export: {
		fields: {
			filename: 'File name',
			unitName: 'Unit name',
			underUnitName: 'Subordinate unit name',
			reportTitle: 'Report title',
			city: 'Place',
			commanderPosition: 'Commander position',
			commanderName: 'Commander name',
			commanderRank: 'Commander rank'
		},
		required: {
			filename: 'File name is required',
			unitName: 'Unit name is required',
			underUnitName: 'Subordinate unit name is required',
			reportTitle: 'Report title is required',
			city: 'Place is required',
			commanderPosition: 'Commander position is required',
			commanderName: 'Commander name is required',
			commanderRank: 'Commander rank is required'
		},
		cancel: 'Cancel',
		confirm: 'Confirm',
		exporting: 'Exporting file...',
		failed: 'Could not export the file, an error occurred!',
		description: 'Fill in the information needed to export the data',
		generic: { title: 'Export data' },
		students: {
			title: 'Export student data',
			columns: 'Columns to export',
			template: 'Export template',
			defaultTemplate: 'Default',
			noColumns: 'Select at least one column to export'
		},
		materialAssets: { title: 'Export weapons/equipment data' },
		materialStocks: { title: 'Export consumable materials data' },
		roster: {
			title: 'Export unit roster',
			description:
				'The roster of this unit and all its subordinate units, grouped by unit'
		}
	},
	preview: {
		title: 'Exported file preview',
		download: 'Download',
		downloading: 'Downloading...',
		failed: 'Could not download the file, an error occurred!'
	},
	templates: {
		title: 'Manage export templates',
		description:
			'Upload your own docx template to use when exporting data, or delete templates you no longer need',
		tabs: { mine: 'My templates', guideline: 'Guide' },
		columns: { name: 'Template name', filename: 'File name' },
		nameLabel: 'Template name',
		namePlaceholder: 'E.g. Weapons report template',
		fileLabel: 'Template file (.docx)',
		upload: 'Upload',
		uploading: 'Uploading...',
		loading: 'Loading...',
		empty: 'No templates yet',
		pickFile: 'Select a template file (.docx)',
		nameRequired: 'Give the template a name',
		uploaded: 'Export template uploaded',
		uploadFailed: 'Could not upload the template, an error occurred!'
	},
	guideline: {
		example: {
			title: 'Example template',
			description:
				'Download a docx template that already uses the variables below, to use as a reference or edit as you like',
			download: 'Download example',
			downloading: 'Downloading...',
			failed: 'Could not download the example, an error occurred!'
		},
		general: {
			title: 'General information variables',
			variable: 'Variable',
			meaning: 'Meaning'
		},
		letterhead: {
			unitName: 'Unit name',
			underUnitName: 'Subordinate unit name',
			city: 'Place',
			day: 'Day the report is made',
			month: 'Month the report is made',
			year: 'Year the report is made',
			reportTitle: 'Report title',
			commanderPosition: "Commander's position",
			commanderRank: "Commander's rank",
			commanderName: "Commander's full name"
		},
		table: {
			title: 'Data table',
			body: 'Table data is inserted with a loop over <code>columns</code> (column headings) and <code>rows</code> (each data row). Column names are generated by the system based on the kind of data you export, e.g. for weapons/equipment: "Số sê-ri", "Loại khí tài", "Tình trạng"...'
		},
		detail: {
			title: 'Detailed data (for complex tables)',
			body: 'If the <code>rows</code>/<code>columns</code> table above is not enough (e.g. you need to combine several pieces of information in one cell, or list children whose number varies per person), use the <code>troopers</code> variable — the full, unabridged list of the selected personnel. Line breaks inside a cell (<code>{{lineBreak}}</code> or the Enter key in Word) still work, and you can nest loops for list fields such as <code>childrenInfos</code> or <code>siblings</code>:',
			fieldsTitle: 'Fields available on each person',
			field: 'Field'
		},
		trooper: {
			fullName: 'Full name',
			dob: 'Date of birth',
			rank: 'Rank',
			position: 'Position',
			previousUnit: 'Previous unit',
			previousPosition: 'Previous position',
			birthPlace: 'Birthplace',
			address: 'Residence',
			enlistmentPeriod: 'Enlistment period',
			ethnic: 'Ethnicity',
			religion: 'Religion',
			educationLevel: 'Education level',
			schoolName: 'School name',
			major: 'Major',
			isGraduated: "Graduated ('Có'/'Không')",
			phone: 'Phone number',
			policyBeneficiaryGroup: 'Policy group',
			politicalOrg: "Youth Union/Party ('hcyu' or 'cpv')",
			politicalOrgOfficialDate: 'Official Youth Union admission date',
			cpvId: 'Party card number',
			cpvOfficialAt: 'Official Party admission date',
			shortcoming: 'Shortcomings',
			talent: 'Talent',
			fatherName: "Father's full name",
			fatherJob: "Father's occupation",
			fatherPhoneNumber: "Father's phone",
			motherName: "Mother's full name",
			motherJob: "Mother's occupation",
			motherPhoneNumber: "Mother's phone",
			isMarried: "Married ('Có'/'Không')",
			spouseName: "Spouse's full name",
			spouseJob: "Spouse's occupation",
			spousePhoneNumber: "Spouse's phone",
			familySize: 'Household size',
			familyBackground: 'Family background',
			achievement: 'Achievements',
			disciplinaryHistory: 'Discipline',
			studentId: 'Student ID',
			status: "Status ('pending' or 'confirmed')",
			unitName: 'Unit name',
			childrenInfos: 'List of children (array of {fullName, dob})',
			siblings: 'List of siblings (array of {fullName, dob})',
			contactPerson: 'Contact person ({name, phoneNumber, address})'
		}
	}
}

export default io
