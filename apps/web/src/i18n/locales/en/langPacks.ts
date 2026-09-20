import type { Messages } from '../../types'
import type vi from '../vi/langPacks'

const langPacks: Messages<typeof vi> = {
	title: 'Language packs',
	subtitle:
		'Change the text shown across the system by uploading a JSON file for each language.',
	status: {
		custom: 'Custom pack in use',
		default: 'Default'
	},
	dropzone: 'Drop a .json file here or click to choose one',
	formatHint:
		'The file only needs the strings you want to change, e.g. { "common": { "actions": { "save": "Save it" } } }. Strings missing from the file keep their default text.',
	downloadTemplate: 'Download default template',
	reset: 'Restore defaults',
	loading: 'Loading…',
	uploading: 'Uploading…',
	result: {
		applied: 'Applied {{count}} string(s).',
		ignored:
			'Skipped {{count}} keys that do not exist in the system or have the wrong structure:',
		placeholders:
			'{{count}} string(s) use placeholders that differ from the original and may display wrongly:'
	},
	confirmReset: {
		title: 'Restore the default pack?',
		description:
			'All custom strings for {{language}} will be removed and the system goes back to the default text.',
		cancel: 'Cancel',
		confirm: 'Restore'
	},
	toast: {
		uploaded: 'Updated the {{language}} language pack',
		uploadFailed: 'Could not update the language pack',
		resetDone: 'Restored the {{language}} language pack to defaults',
		resetFailed: 'Could not restore the language pack'
	},
	errors: {
		notJsonFile: 'Only .json files are accepted',
		tooLarge: 'The file is larger than {{kb}} KB',
		notJson: 'The file is not valid JSON',
		notObject:
			'The file must be a JSON object shaped like { "namespace": { "key": "value" } }',
		invalidValue: 'The value at "{{path}}" must be a string',
		nothingToApply: 'None of the strings in the file match the system'
	}
}

export default langPacks
