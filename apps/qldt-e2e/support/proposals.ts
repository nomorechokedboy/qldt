import { expect, type Page } from '@playwright/test'
import { t } from './text'

// Only a unit's commanders can raise or decide a proposal for it: one of them
// proposes, another (the one picked as approver) decides. Chapter 07 creates
// both accounts and names them in the battalion's command.
export const REQUESTER = {
	displayName: 'Phạm Quang Vinh',
	username: 'vinh.d8',
	password: 'Vinh@12345'
}
export const APPROVER = {
	displayName: 'Nguyễn Văn Hùng',
	username: 'hung.d8',
	password: 'Hung@12345'
}

export const loginLabels = () => ({
	username: t('auth:login.username'),
	password: t('auth:login.password'),
	submit: t('auth:login.submit')
})

// The create-proposal sheet, and the checklist of troopers inside it.
export const sheet = (page: Page) => page.getByRole('dialog').last()
export const troopers = (page: Page) => sheet(page).locator('form')

export const rowFor = (page: Page, text: string) =>
	page.getByRole('row').filter({ hasText: text })

export async function pickTrooper(page: Page, name: string) {
	await troopers(page)
		.getByRole('checkbox', { name: new RegExp(name) })
		.check()
}

// Submit the sheet and wait for the kind's success toast and the sheet to go.
export async function submitProposal(
	page: Page,
	kind: 'rank' | 'activity' | 'transfer'
) {
	await sheet(page)
		.getByRole('button', {
			name: t(`proposals:${kind}.submit`),
			exact: true
		})
		.click()
	await expect(
		page.getByText(t(`proposals:${kind}.created`)).first()
	).toBeVisible()
	await expect(sheet(page)).toBeHidden()
}
