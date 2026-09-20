import type { Messages } from '../../types'
import type vi from '../vi/student'

const student: Messages<typeof vi> = {
	steps: {
		personal: {
			title: 'Personal information',
			hint: 'Name, residence, education'
		},
		other: {
			title: 'Other information',
			hint: 'Rank, position, political'
		},
		parent: {
			title: 'Parents',
			hint: 'Father, mother, siblings'
		},
		family: {
			title: 'Spouse and children',
			hint: 'Spouse and children'
		}
	},
	wizard: {
		add: 'Add personnel',
		adding: 'Adding personnel...',
		description:
			'Complete the {{count}} steps in order to create the personnel record.',
		stepOf: 'Step {{current}}/{{total}}: {{title}}',
		stepsNav: 'Steps',
		done: 'Done',
		back: 'Back',
		next: 'Next',
		created: 'Personnel added successfully!',
		createFailed: 'Failed to add personnel!'
	},
	editForm: {
		title: 'Edit personnel',
		cancel: 'Cancel',
		save: 'Save changes',
		saving: 'Saving...',
		saveFailed: 'Failed to update the personnel information!'
	},
	info: {
		title: 'Personnel information',
		studentId: 'Personnel ID: {{id}}',
		noStudentId: 'none',
		confirmed: 'Confirmed',
		yes: 'Yes',
		notYet: 'Not yet',
		married: 'Married',
		single: 'Single',
		noChildren: 'No children recorded',
		noSiblings: 'No siblings recorded'
	},
	actions: {
		downloadSummary: 'Download summary',
		confirm: 'Confirm',
		confirmPrompt:
			'Are you sure you want to confirm this personnel record? You will not be able to edit it after confirmation.',
		confirmSuccess: 'Personnel confirmed successfully!',
		confirmFailed: 'Failed to confirm personnel!',
		edit: 'Edit',
		editTitle: 'Edit personnel information',
		editDescription: 'Edit the record of {{name}}.'
	},
	record: {
		sectionsNav: 'Sections',
		sections: {
			personal: {
				label: 'Personal information',
				hint: 'Name, residence, contact'
			},
			military: {
				label: 'Military & Political',
				hint: 'Rank, position, political'
			},
			education: {
				label: 'Education & Skills',
				hint: 'Schooling, talents'
			},
			family: {
				label: 'Family',
				hint: 'Parents, spouse, children'
			},
			history: {
				label: 'History & Other',
				hint: 'Commendations, discipline, documents'
			}
		},
		cover: {
			fullName: 'Full name',
			rank: 'Rank',
			position: 'Position',
			unit: 'Unit'
		},
		photo: {
			alt: '3x4 portrait of the person',
			choose: 'Choose 3x4 photo',
			change: 'Change photo',
			inputLabel: 'Personnel photo',
			formats: 'JPG, PNG or WebP, up to 2 MB',
			tooLarge: 'The photo is over 2 MB, choose a smaller one.'
		}
	},
	sections: {
		identity: 'Name and identification',
		workUnit: 'Work unit',
		places: 'Hometown and residence',
		birthPlaceLabel: 'Birthplace',
		addressLabel: 'Residence',
		ethnicityReligionEducation: 'Ethnicity, religion and education',
		ethnicityReligion: 'Ethnicity and religion',
		military: 'Military',
		politics: 'Political',
		contact: 'Emergency contact',
		contactHint: 'Who to contact when something concerns the person.',
		remarks: 'Remarks',
		education: 'Education',
		skillsAndPolicy: 'Skills and policy',
		household: 'Household',
		father: 'Father',
		mother: 'Mother',
		siblings: 'Siblings',
		siblingsCount: 'Siblings ({{count}})',
		spouse: 'Spouse',
		spouseHint: 'Leave blank if the person is not married.',
		children: 'Children',
		childrenCount: 'Children ({{count}})',
		familyBackground: 'Family background',
		history: 'History',
		documents: 'Documents'
	},
	fields: {
		fullName: 'Full name',
		name: 'Full name',
		dob: 'Date of birth',
		phone: 'Phone number',
		address: 'Address',
		job: 'Occupation',
		unit: 'Unit',
		ethnic: 'Ethnicity',
		religion: 'Religion',
		rank: 'Rank',
		position: 'Position',
		enlistmentDate: 'Enlistment date',
		activityStatus: 'Status',
		youthJoinDate: 'Youth Union join date',
		partyJoinDate: 'Party join date',
		cpvId: 'Party card number',
		previousUnit: 'Previous unit',
		previousPosition: 'Previous position',
		talent: 'Strengths',
		shortcoming: 'Weaknesses',
		discipline: 'Discipline',
		policyGroup: 'Policy beneficiary group',
		graduated: 'Graduated',
		documents: 'Attached documents',
		childName: "Child's full name",
		siblingName: "Sibling's full name"
	},
	create: {
		studentId: 'Personnel ID',
		educationLevel: 'Education level',
		schoolName: 'School name',
		major: 'Major',
		politicalOrg: 'Youth Union/Party',
		contactName: 'Contact person',
		achievement: 'Achievements',
		familySize: 'Number of family members',
		birthOrder: 'Birth order',
		familyBackground: 'Summary of family background',
		fatherName: "Father's name",
		fatherDob: "Father's date of birth",
		fatherJob: "Father's occupation",
		fatherPhone: "Father's phone number",
		motherName: "Mother's name",
		motherDob: "Mother's date of birth",
		motherJob: "Mother's occupation",
		motherPhone: "Mother's phone number",
		spouseName: "Spouse's name",
		spouseDob: "Spouse's date of birth",
		spousePhone: "Spouse's phone number",
		spouseJob: "Spouse's occupation",
		datePlaceholder: 'Day/month/year',
		chooseUnit: 'Choose a unit',
		chooseEthnic: 'Choose an ethnicity',
		chooseReligion: 'Choose a religion',
		chooseEducation: 'Choose an education level',
		chooseRank: 'Choose a rank',
		choosePosition: 'Choose a position',
		chooseStatus: 'Choose a status'
	},
	recordFields: {
		studentId: 'Personnel ID',
		schoolName: 'School',
		major: 'Major',
		educationLevel: 'Level',
		politicalOrg: 'Organisation',
		achievement: 'Commendations',
		familySize: 'Family members',
		birthOrder: 'Birth order',
		familyBackground: 'Family background',
		married: 'Married',
		spouseName: "Spouse's full name",
		spousePhone: "Spouse's phone",
		status: 'Status'
	},
	place: {
		birthPlace: 'hometown',
		address: 'residence',
		province: 'Province/City ({{place}})',
		ward: 'Ward/Commune ({{place}})',
		street: 'House number, street ({{place}})',
		chooseProvince: 'Choose a province/city',
		chooseWard: 'Choose a ward/commune',
		chooseProvinceFirst: 'Choose a province/city first'
	},
	people: {
		childTitle: 'Child {{n}}',
		addChild: 'Add a child',
		childPlaceholder: "Child's full name...",
		siblingTitle: 'Sibling {{n}}',
		addSibling: 'Add a sibling',
		siblingPlaceholder: "Sibling's full name..."
	},
	validation: {
		dateFormat: 'Use the Day/month/year format',
		invalidDate: 'Invalid date',
		editDateFormat: 'Enter the date as dd/mm/yyyy',
		fullNameRequired: 'Full name is required',
		ethnicRequired: 'Ethnicity is required',
		religionRequired: 'Religion is required',
		educationRequired: 'Education level is required',
		positionRequired: 'Position is required',
		nameRequired: 'Full name is required'
	}
}

export default student
