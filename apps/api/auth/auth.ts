import { api, APIError, Gateway, Header } from 'encore.dev/api'
import { authHandler } from 'encore.dev/auth'
import log from 'encore.dev/log'
import authController from './controller'
import { AppError } from '../errors'
import { getAuthData } from '~encore/auth'
import userController from '../users/controller'
import { UserDB } from '../schema'
import { User } from '../users/users'
import { getLockedLoginUsernames, unlockLogin } from '../middleware/rate-limit'

interface AuthParams {
	authorization: Header<'Authorization'>
}

interface AuthData {
	userID: string
	permissions: string[]
	isSuperAdmin: boolean
}

export const auth = authHandler<AuthParams, AuthData>(async (params) => {
	const token = params.authorization.replace('Bearer ', '')
	if (!token) {
		throw APIError.unauthenticated('no token provided')
	}

	try {
		const payload = authController.verifyToken(token)

		if (payload.type !== 'access') {
			throw new Error('Invalid token type')
		}

		// Return simplified auth data - validUnitIds computed in middleware
		return {
			userID: payload.userId.toString(),
			permissions: payload.permissions || [],
			isSuperAdmin: payload.isSuperUser
		}
	} catch (err) {
		log.error('authHandler error', { err })
		AppError.handleAppErr(err)
	}
})

export const mygw = new Gateway({ authHandler: auth })

interface LoginRequest {
	username: string
	password: string
}

interface LoginResponse {
	accessToken: string
	refreshToken: string
}

export const Login = api(
	{
		expose: true,
		method: 'POST',
		path: '/authn/login',
		tags: ['rate_limit']
	},
	async ({ username, password }: LoginRequest): Promise<LoginResponse> => {
		const { accessToken, refreshToken } = await authController.login({
			password,
			username
		})
		return { refreshToken, accessToken }
	}
)

interface RefreshTokenRequest {
	token: string
}

interface RefreshTokenResponse extends LoginResponse {}

export const RefreshToken = api(
	{ expose: true, method: 'POST', path: '/authn/refresh' },
	async ({ token }: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
		const { accessToken, refreshToken } = await authController.refreshToken(
			{ token }
		)

		return { accessToken, refreshToken }
	}
)

interface GetUserInfoResponse {
	data: User
	permissions: string[]
	isSuperAdmin: boolean
}

export const GetUserInfo = api(
	{ auth: true, expose: true, method: 'GET', path: '/authn/me' },
	async (): Promise<GetUserInfoResponse> => {
		const authData = getAuthData()!
		const userId = Number(authData.userID)
		const userData = await userController.findOne({ id: userId } as UserDB)

		const data = {
			...userData,
			unitName: userData.unit?.name || null
		} as User

		return {
			data,
			permissions: authData.permissions,
			isSuperAdmin: authData.isSuperAdmin
		}
	}
)

export const GetLockedLoginUsernames = api(
	{ auth: true, expose: true, method: 'GET', path: '/authn/locked-users' },
	async (): Promise<{ usernames: string[] }> => {
		return { usernames: getLockedLoginUsernames() }
	}
)

interface UnlockLoginRequest {
	username: string
}

export const UnlockLogin = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/authn/unlock-login'
	},
	async ({ username }: UnlockLoginRequest): Promise<{ success: true }> => {
		unlockLogin(username)
		log.info('AuthController.UnlockLogin cleared login rate limit', {
			username,
			requestedBy: getAuthData()?.userID
		})
		return { success: true }
	}
)

interface ChangeUserPasswordRequest {
	prevPassword: string
	password: string
}

export const ChangeUserPassword = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/authn/change-pwd' },
	async ({ password, prevPassword }: ChangeUserPasswordRequest) => {
		const userId = Number(getAuthData()!.userID)
		await authController.changePassword({ password, prevPassword, userId })

		return {}
	}
)
