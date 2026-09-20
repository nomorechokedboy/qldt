import type { Messages } from '../../types'
import type vi from '../vi/common'

const common: Messages<typeof vi> = {
	language: { label: 'Language' },
	actions: {
		refresh: 'Refresh'
	}
}

export default common
