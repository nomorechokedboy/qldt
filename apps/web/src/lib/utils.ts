import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { type students } from '@/api/client'
import type { UnitPoliticsQualitySummary, Unit } from '@/types'
import { ApiUrl } from '@/lib/const'

dayjs.locale('vi')
dayjs.extend(relativeTime)
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// apps/api stores timestamps as naive UTC strings (SQLite's CURRENT_TIMESTAMP,
// "YYYY-MM-DD HH:MM:SS" with no offset/'Z'). Passing that straight to
// `dayjs()`/`new Date()` gets parsed as browser-local time instead of UTC,
// so every displayed timestamp is off by the Vietnam UTC+7 offset. Always
// anchor with `dayjs.utc(...)` first so the instant is correct, then convert
// to Asia/Ho_Chi_Minh for display.
export function formatTimestamp(timestamp: string) {
	return dayjs.utc(timestamp).tz('Asia/Ho_Chi_Minh').fromNow()
}

// Shared formatter for any DB timestamp (createdAt/updatedAt/etc.) shown in
// the UI - see the comment on formatTimestamp above for why the UTC anchor
// matters. Default format matches the vi-VN locale string most call sites
// used to build by hand via `new Date(x).toLocaleString('vi-VN')`.
export function formatDbTimestamp(
	timestamp: string,
	fmt = 'DD/MM/YYYY HH:mm:ss'
) {
	return dayjs.utc(timestamp).tz('Asia/Ho_Chi_Minh').format(fmt)
}

export function getCurrentWeekNumber() {
	return dayjs().week()
}

export function getCurrentQuarter() {
	return dayjs().quarter()
}

// Local (not UTC) yyyy-mm-dd - callers filtering an API by date generally
// compare against a plain date column, and Date#toISOString() would shift
// the date by the viewer's UTC offset and can land on the wrong calendar day.
export function toIsoDateString(date: Date): string {
	const year = date.getFullYear().toString().padStart(4, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function toVNTz(utcTimestamp: string) {
	return dayjs.utc(utcTimestamp).tz('Asia/Ho_Chi_Minh').format('DD-MM-YYYY')
}

export function transformPoliticsQualityData(
	params: students.GetPoliticsQualityReportResponse | undefined
) {
	if (params === undefined) {
		return []
	}

	const { data, units } = params

	function mergeReports(
		target: Record<string, any>,
		source: Record<string, any>
	) {
		for (const [key, value] of Object.entries(source)) {
			if (typeof value === 'number') {
				target[key] = (target[key] ?? 0) + value
			} else if (typeof value === 'object' && value !== null) {
				target[key] = mergeReports(target[key] ?? {}, value)
			}
		}
		return target
	}

	function traverse(unitNode: Unit): UnitPoliticsQualitySummary {
		let unitReport: Record<string, any> = data[unitNode.id] ?? {}
		const childrenReport: UnitPoliticsQualitySummary[] = []

		// collect children reports recursively (squads are leaf children too)
		if (unitNode.children && unitNode.children.length > 0) {
			for (const child of unitNode.children) {
				const childSummary = traverse(child)
				childrenReport.push(childSummary)
				if (childSummary.politicsQualityReport) {
					unitReport = mergeReports(
						unitReport,
						childSummary.politicsQualityReport
					)
				}
			}
		}

		const unitSummary: UnitPoliticsQualitySummary = {
			name: unitNode.name,
			politicsQualityReport:
				Object.keys(unitReport).length > 0 ? unitReport : null
		}

		if (childrenReport.length > 0) {
			unitSummary.children = childrenReport
		}

		return unitSummary
	}

	return units.map((unit) => traverse(unit as unknown as Unit))
}

export function convertToIso(dateStr: string): string {
	const [day, month, year] = dateStr.split('/')
	return `${year}-${month}-${day}`
}

export function getMediaUri(uri: string) {
	const mediaUrl = 'media'

	return `${ApiUrl}/${mediaUrl}/${uri}`
}

// Backend error messages are written in English by convention (internal/
// defensive-guard errors, mostly) except for a handful that were deliberately
// localized for the end user (e.g. duplicate-value errors). Users of this app
// only read Vietnamese, so: show the backend message only when it's already
// Vietnamese (detected via diacritics), otherwise fall back to the caller's
// Vietnamese message - this never leaks raw English to the UI, while still
// surfacing specific backend messages once/if they get localized too.
const VIETNAMESE_DIACRITICS =
	/[àáạảãăằắặẳẵâầấậẩẫèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

export function getErrorMessage(err: unknown, fallback: string): string {
	if (
		err instanceof Error &&
		err.message &&
		VIETNAMESE_DIACRITICS.test(err.message)
	) {
		return err.message
	}
	return fallback
}

export const isSuperAdmin = (): boolean => {
	try {
		const token = localStorage.getItem('qlhvAccessToken')
		if (!token) return false
		const parts = token.split('.')
		if (parts.length !== 3) return false
		const payload = JSON.parse(atob(parts[1]))
		return payload.isSuperUser === true
	} catch {
		return false
	}
}

export function IsExceedApplyTime(completedAt: string) {
	const limitDate = dayjs(completedAt).add(1, 'week')
	return dayjs().isAfter(limitDate)
}
