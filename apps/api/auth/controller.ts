import userRepo from '../users/repo'
import { Repository as UserRepository } from '../users'
import log from 'encore.dev/log'
import { UserDB } from '../schema'
import { AppError } from '../errors'
import argon2 from 'argon2'
import { appConfig } from '../configs'
import jwt from 'jsonwebtoken'
import authzController from '../authz/controller'
import type { StringValue } from 'ms'

type LoginRequest = {
	username: string
	password: string
}

type TokenPayload = {
	userId: number
	isSuperUser: boolean
	status?: string
	permissions: string[]
	type: 'access' | 'refresh'
	iat?: number
	exp?: number
}

type TokenResponse = {
	accessToken: string
	refreshToken: string
}

type RefreshTokenRequest = {
	token: string
}

type ChangePasswordRequest = {
	userId: number
	prevPassword: string
	password: string
}

class controller {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly repo = userRepo
	) {}

	async genTokens(user: UserDB): Promise<TokenResponse> {
		// Get user permissions from RBAC system
		const permissions = await authzController.getUserPermissions(user.id)

		const accessPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
			userId: user.id,
			isSuperUser: user.isSuperUser,
			status: user.status,
			permissions,
			type: 'access'
			// validUnitIds computed dynamically in middleware
		}

		const refreshPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
			userId: user.id,
			isSuperUser: user.isSuperUser,
			status: user.status,
			permissions: [], // Refresh tokens don't need permissions
			type: 'refresh'
		}

		const accessToken = await this.genToken(
			accessPayload,
			appConfig.JWT_PRIVATE_KEY,
			{
				expiresIn: '30m'
			}
		)

		const refreshToken = await this.genToken(
			refreshPayload,
			appConfig.JWT_PRIVATE_KEY,
			{
				expiresIn: '7d'
			}
		)

		return { accessToken, refreshToken }
	}

	async genToken(
		payload: Omit<TokenPayload, 'iat' | 'exp'>,
		secret: string,
		{ expiresIn }: { expiresIn?: number | StringValue }
	): Promise<string> {
		try {
			const token = jwt.sign(payload, secret, {
				issuer: 'cdhc2-student-management-api',
				audience: ['cdhc2-student-management-web'],
				expiresIn
			})

			return token
		} catch (error) {
			log.error('AuthController.genToken error generating tokens', {
				error,
				userId: payload.userId
			})
			throw AppError.handleAppErr(
				AppError.internal('Failed to generate tokens')
			)
		}
	}

	verifyToken(token: string): TokenPayload {
		try {
			return jwt.verify(token, appConfig.JWT_PRIVATE_KEY, {
				issuer: 'cdhc2-student-management-api',
				audience: ['cdhc2-student-management-web']
			}) as TokenPayload
		} catch (err) {
			if (err instanceof jwt.JsonWebTokenError) {
				throw AppError.handleAppErr(
					AppError.unauthenticated('Invalid token')
				)
			}
			if (err instanceof jwt.TokenExpiredError) {
				throw AppError.handleAppErr(
					AppError.unauthenticated('Token expired')
				)
			}
			throw AppError.handleAppErr(
				AppError.internal('Token verification failed')
			)
		}
	}

	verifyPwd(hashStr: string, pwd: string): Promise<boolean> {
		return argon2.verify(hashStr, pwd, {
			secret: Buffer.from(appConfig.HASH_SECRET)
		})
	}

	async login(req: LoginRequest): Promise<TokenResponse> {
		log.trace('AuthController.login request', { req })
		const { username, password } = req

		const user = await this.userRepo
			.findOne({ username } as UserDB)
			.catch(AppError.handleAppErr)
		if (user === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('username or password is incorrect')
			)
		}

		const isPasswordMatch = await this.verifyPwd(user.password, password)
		if (isPasswordMatch === false) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('username or password is incorrect')
			)
		}

		const tokens = await this.genTokens(user)
		log.info('User logged in successfully', {
			userId: user.id,
			username: user.username
		})

		return { ...tokens }
	}

	async refreshToken(req: RefreshTokenRequest): Promise<TokenResponse> {
		const { userId, isSuperUser, type } = this.verifyToken(req.token)
		if (type !== 'refresh') {
			throw AppError.handleAppErr(
				AppError.unauthenticated('Invalid token type')
			)
		}

		const user = await this.userRepo
			.findOne({ id: userId } as UserDB)
			.catch(AppError.handleAppErr)
		if (user === undefined) {
			throw AppError.handleAppErr(
				AppError.unauthenticated('Invalid token')
			)
		}

		const permissions = await authzController.getUserPermissions(userId)

		const accessToken = await this.genToken(
			{
				userId,
				permissions,
				type: 'access',
				isSuperUser,
				status: user.status
			},
			appConfig.JWT_PRIVATE_KEY,
			{
				expiresIn: '30m'
			}
		)

		return { accessToken, refreshToken: req.token }
	}

	async changePassword(params: ChangePasswordRequest) {
		log.trace('AuthController.changePassword params', { params })

		const user = await this.userRepo
			.findOne({ id: params.userId } as UserDB)
			.catch(AppError.handleAppErr)
		if (user === undefined) {
			throw AppError.handleAppErr(AppError.notFound('User not found'))
		}

		const isOldPwdMatchPwd = await this.verifyPwd(
			user.password,
			params.prevPassword
		)
		if (isOldPwdMatchPwd === false) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Incorrect password')
			)
		}

		let hashPwd: string
		try {
			hashPwd = await argon2.hash(params.password, {
				secret: Buffer.from(appConfig.HASH_SECRET)
			})
		} catch (err) {
			log.error('AuthController.changePassword hash error', { err })
			throw AppError.handleAppErr(AppError.internal('Internal error'))
		}

		await this.userRepo
			.update({ id: user.id, password: hashPwd })
			.catch(AppError.handleAppErr)
	}
}

const authController = new controller(userRepo)

export default authController
