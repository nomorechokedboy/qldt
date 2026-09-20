import type { Messages } from '../../types'
import type vi from '../vi/auth'

const auth: Messages<typeof vi> = {
	brand: {
		unit: 'Brigade 75, Military Region 7',
		product: 'Unit and weapons-equipment management software',
		tagline:
			'Your unit’s personnel, weapons, equipment and supplies in one system.'
	},
	login: {
		title: 'Log in',
		subtitle: 'Use the account issued by your unit.',
		username: 'Username',
		password: 'Password',
		usernameRequired: 'Username is required',
		passwordRequired: 'Password is required',
		submit: 'Log in',
		submitting: 'Logging in...',
		forgot: 'Forgot your password? Ask your unit administrator to reset it.',
		version: 'Version {{version}}',
		success: 'Logged in',
		failed: 'Login failed'
	},
	password: {
		show: 'Show password',
		hide: 'Hide password'
	}
}

export default auth
