import type { Messages } from '../../types'
import type vi from '../vi/common'

const common: Messages<typeof vi> = {
	language: { label: 'Language' },
	form: {
		searchPlaceholder: 'Search {{label}}...',
		uploadPrompt: 'Choose or drag and drop to upload'
	},
	actions: {
		refresh: 'Refresh'
	}
}

export default common
