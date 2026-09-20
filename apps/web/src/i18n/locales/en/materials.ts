import type { Messages } from '../../types'
import type vi from '../vi/materials'

const materials: Messages<typeof vi> = {
	categories: {
		furniture: 'Furniture',
		equipment: 'Equipment',
		weapon: 'Weapons',
		vehicle: 'Vehicles'
	},
	assetStatus: {
		in_service: 'In service',
		damaged: 'Damaged',
		lost: 'Lost',
		retired: 'Retired'
	},
	condition: {
		good: 'Good',
		fair: 'Fair',
		needs_maintenance: 'Needs maintenance',
		damaged: 'Damaged'
	},
	import: {
		cancel: 'Cancel',
		close: 'Close',
		fixErrorsFirst: 'Please fix the rows with errors before importing',
		importing: 'Importing...',
		confirm: 'Confirm & Import',
		results: {
			title: 'Import results:',
			success: 'Succeeded',
			errors: 'Errors',
			total: 'Total',
			errorDetails: 'Error details:',
			row: 'Row {{row}}: {{message}}'
		},
		review: {
			status: 'Status',
			error: 'Error',
			title: 'Preview import data',
			description:
				'Review and edit the data below before importing it into the system',
			chooseAnother: 'Choose another file',
			total: 'Total:',
			valid: 'Valid: {{count}}',
			errorCount: 'Errors: {{count}}',
			empty: 'No data',
			hint: 'Hover the "Error" label on a row to see the details.'
		},
		upload: {
			step1: 'Download the template file',
			step2: 'Fill in the {{itemNoun}} details following the template',
			step3: 'Upload the file and press Import',
			templateTitle: 'Excel template',
			templateHint: 'Download it to get the exact data structure',
			download: 'Download',
			chooseHeading: 'Choose a file to import',
			chooseAnother: 'Choose another file',
			dropHint: 'Drag and drop a file here or',
			pick: 'choose a file',
			supported: 'Supports CSV and Excel (.xlsx, .xls) files'
		},
		state: {
			unsupportedFile: 'Please choose a CSV or Excel (.xlsx, .xls) file',
			readFailed: 'Could not read the file. Please try again.',
			badFormat: 'Could not read the file. Please check its format.',
			noFile: 'Please choose a file to import',
			fixReferenceErrors:
				'Please fix the rows with reference errors before importing.',
			processing: 'Processing file...',
			done: 'Import complete! Succeeded: {{success}}/{{total}} {{itemNoun}}',
			failed: 'Import failed: {{message}}',
			templateFailed: 'Could not create the file: {{message}}'
		}
	},
	importAssets: {
		title: 'Import weapons/equipment',
		description: 'Upload an Excel or CSV file to add many assets at once.',
		itemNoun: 'assets',
		referenceErrors:
			'The file was read, but {{count}} rows contain reference errors (invalid asset/unit/location/trooper).',
		columns: {
			materialType: 'Asset type',
			serialNumber: 'Serial number',
			unit: 'Unit',
			room: 'Location',
			condition: 'Condition',
			status: 'Usage status',
			assignedTrooper: 'Assigned to trooper'
		},
		pickMaterialType: '-- Select asset type --',
		defaultCondition: '-- Default (Good) --',
		defaultStatus: '-- Default (In service) --'
	},
	importStocks: {
		title: 'Import consumable supplies',
		description:
			'Upload an Excel or CSV file to add many supplies at once.',
		itemNoun: 'supplies',
		referenceErrors:
			'The file was read, but {{count}} rows contain reference errors (invalid supply/unit/location).',
		columns: {
			materialType: 'Supply type',
			unit: 'Unit',
			room: 'Location',
			quantity: 'Quantity',
			condition: 'Condition'
		},
		pickMaterialType: '-- Select supply type --'
	},
	importShared: {
		pickUnit: '-- Select unit --'
	},
	shared: {
		noSpecificRoom: 'No specific location',
		notAssigned: 'Not assigned',
		noValue: '—'
	},
	actions: {
		edit: 'Edit',
		update: 'Update',
		delete: 'Delete'
	},
	columns: {
		images: 'Images',
		name: 'Name',
		category: 'Category',
		unitOfMeasure: 'Unit of measure',
		managementType: 'Tracking type',
		serialNumber: 'Serial number',
		assetType: 'Asset type',
		stockType: 'Supply type',
		unit: 'Unit',
		room: 'Location',
		assignedTo: 'Assigned to',
		quantity: 'Quantity',
		condition: 'Condition',
		status: 'Status'
	},
	assetTable: {
		allocate: 'Assign / update',
		history: 'History',
		downloadQr: 'Download QR code',
		editTitle: 'Update asset',
		confirmDelete:
			'Are you sure you want to delete the asset "{{name}}"? This cannot be undone.',
		deleted: 'Asset deleted successfully!',
		deleteFailed: 'Failed to delete the asset!'
	},
	stockTable: {
		editTitle: 'Update supply',
		confirmDelete:
			'Are you sure you want to delete the supply "{{name}}"? This cannot be undone.',
		deleted: 'Supply deleted successfully!',
		deleteFailed: 'Failed to delete the supply!'
	},
	typeTable: {
		bySerial: 'By serial number',
		byQuantity: 'By quantity',
		editTitle: 'Edit material type',
		confirmDelete:
			'Are you sure you want to delete the type "{{name}}"? This cannot be undone.',
		deleted: 'Material type deleted successfully!',
		deleteFailed: 'Failed to delete the material type!'
	},
	assetQr: {
		title: 'Asset QR code - {{serial}}',
		ariaLabel: 'Asset QR code {{serial}}',
		hint: 'Print this code and stick it on the asset. Condition when printed: {{condition}}. The actual condition still needs to be confirmed again during inventory.'
	},
	assetHistory: {
		title: 'Asset history',
		empty: 'No change history yet.',
		from: 'From:',
		to: '→ To:',
		by: 'Done by: {{name}}',
		unknownUnit: 'Unknown unit',
		noRoom: 'No location',
		events: {
			assigned: 'Assigned',
			unassigned: 'Returned',
			condition_changed: 'Condition changed',
			status_changed: 'Status changed',
			transferred: 'Unit/location transfer'
		}
	},
	form: {
		cancel: 'Cancel',
		add: 'Add',
		adding: 'Adding...',
		save: 'Save',
		saving: 'Saving...',
		unit: 'Belongs to unit',
		pickUnit: 'Select unit',
		pickRoomOptional: 'Select location (optional)',
		pickCondition: 'Select condition'
	},
	assetForm: {
		trigger: 'Add asset',
		title: 'Add asset/weapon form',
		created: 'Asset added successfully',
		createFailed: 'Failed to add the asset!',
		pickType: 'Select asset type',
		pickRoom: 'Select room (optional)',
		assignTrooper: 'Assign to trooper',
		pickTrooperOptional: 'Select trooper (optional)'
	},
	assetEdit: {
		updated: 'Asset updated successfully',
		updateFailed: 'Failed to update the asset!',
		pickStatus: 'Select status',
		pickTrooper: 'Select trooper',
		note: 'Change note',
		notePlaceholder: 'Reason for the change (optional)'
	},
	stockForm: {
		trigger: 'Add supply',
		title: 'Add supply form',
		created: 'Supply added successfully',
		createFailed: 'Failed to add the supply!',
		pickType: 'Select supply type'
	},
	stockEdit: {
		updated: 'Supply updated successfully',
		updateFailed: 'Failed to update the supply!'
	},
	typeForm: {
		trigger: 'Add type',
		title: 'Add material type form',
		created: 'Material type added successfully',
		createFailed: 'Failed to add the material type!',
		namePlaceholder: 'e.g. AK rifle, Chair, Bed',
		pickCategory: 'Select category',
		uomPlaceholder: 'e.g. piece, unit, set',
		serialized:
			'Track each item by its own serial number (weapons, vehicles, ...)'
	},
	typeEdit: {
		updated: 'Material type updated successfully',
		updateFailed: 'Failed to update the material type!',
		serialized: 'Track each item by its own serial number'
	},
	imagesUpload: {
		remove: 'Remove image',
		add: 'Add image'
	},
	qrCode: {
		tooLarge:
			'Cannot create the QR code - the data is too large for one QR code.',
		download: 'Download QR code'
	},
	inventory: {
		diffStatus: {
			matched: 'Matched',
			missing: 'Missing',
			extra: 'Unexpected',
			condition_changed: 'Condition changed'
		},
		stockDiffStatus: {
			matched: 'Matched',
			short: 'Short',
			over: 'Over',
			extra: 'Unexpected'
		},
		sessionStatus: {
			in_progress: 'In progress',
			completed: 'Awaiting confirmation',
			reviewed: 'Confirmed',
			expired: 'Expired'
		},
		diff: {
			empty: 'No discrepancy data.',
			expectedCondition: 'Expected condition:',
			observedCondition: 'Observed condition:',
			none: 'None'
		},
		stockDiff: {
			empty: 'No quantity-counted materials.',
			quantities: 'Expected: {{expected}} - Observed: {{observed}}'
		},
		challengeQrLabel: 'Inventory session QR code',
		scanner: {
			cameraDenied:
				'Cannot access the camera. Please allow camera access for the browser.',
			noQrInImage:
				'No QR code found in the image, please try another one.',
			unreadableImage:
				'This image could not be read, please try another one.',
			uploadInstead: 'You can upload a photo of the QR code instead.',
			uploadOptional:
				'Or upload a photo of the QR code if the camera is unavailable.',
			upload: 'Upload image'
		},
		dialog: {
			triggerTitle: 'Inventory by QR code',
			title: 'Inventory - {{roomName}}',
			intro: 'Generate a QR code to start an inventory session for the weapons/equipment in this room. Use the phone app to scan the code and count offline.',
			checking: 'Checking session...',
			creating: 'Creating...',
			create: 'Generate inventory QR code',
			createFailed: 'Cannot create an inventory session for this room',
			challengeSummary:
				'{{assets}} item(s) to count and {{stocks}} quantity-counted material line(s). Scan this code with the phone app, then press the button below to scan the results back once the count is done.',
			scanResults: 'Scan results from the phone',
			retryScan: 'Scan again',
			recording: 'Recording results...',
			aimAtQr:
				'Hold the results QR code from the phone in front of the camera.',
			invalidQr: 'Invalid QR code, please try again',
			wrongFormat: 'The QR code is not an inventory result',
			submitFailed:
				'Cannot record the inventory results - the QR code may have been altered or the session is closed',
			reviewedNote: 'These results have been confirmed.',
			confirming: 'Confirming...',
			confirm: 'Confirm as checked',
			confirmed: 'Inventory results confirmed',
			confirmFailed: 'Cannot confirm the inventory results',
			done: 'Done'
		},
		history: {
			title: 'Inventory history - {{roomName}}',
			loading: 'Loading...',
			completedAt: 'Completed at:',
			notCompleted: 'Not completed',
			sessionStatus: 'Session status',
			status: 'Status',
			allStatuses: 'All statuses',
			dateRange: 'Date range',
			empty: 'This room has no inventory sessions yet.',
			createdAt: 'Created at:',
			loadMore: 'Load more'
		},
		apply: {
			title: 'Apply to stock',
			applied: 'The inventory results have been applied to stock.',
			automatic:
				'Applied automatically: {{missing}} asset(s) will be marked "Lost", {{conditionChanged}} asset(s) will have their condition updated.',
			extraAssets:
				'Unexpected assets - select to move them into this room',
			stockLines:
				'Discrepant material lines - select to update quantities',
			observedQuantity: 'observed {{count}}',
			applying: 'Applying...',
			success:
				'Applied to stock: {{missing}} missing, {{conditionChanged}} condition changes, {{extraAssets}} unexpected assets, {{stockLines}} material lines',
			failed: 'Cannot apply the inventory results to stock'
		}
	},
	catalog: {
		title: 'Material catalog',
		searchPlaceholder: 'Search by material name...',
		empty: 'No material catalog entries yet'
	}
	// __END__
}

export default materials
