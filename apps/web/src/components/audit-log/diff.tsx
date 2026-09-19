'use client'

import { useMemo, useState } from 'react'
import {
	Check,
	ChevronRight,
	CircleAlert,
	FileJson,
	Minus,
	Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue }
type ChangeType = 'added' | 'removed' | 'changed'

type DiffEntry = {
	path: string
	label: string
	type: ChangeType
	before?: JsonValue
	after?: JsonValue
	depth: number
}

const previousSettings: JsonValue = {
	service: {
		name: 'Production API',
		environment: 'production',
		owner: { team: 'Platform', contact: 'ops@example.com' }
	},
	access: {
		status: 'active',
		authentication: { provider: 'api-key', rotationDays: 90 },
		allowedRoles: ['admin', 'developer']
	},
	traffic: {
		rateLimit: { requests: 1000, window: '1m' },
		regions: ['us-east-1', 'eu-west-1']
	},
	notifications: {
		email: 'ops@example.com',
		slack: false,
		escalation: { afterMinutes: 30, channels: ['email'] }
	},
	retention: { days: 30, archiveEnabled: false }
}

const currentSettings: JsonValue = {
	service: {
		name: 'Production API',
		environment: 'production',
		owner: { team: 'Platform', contact: 'platform@example.com' }
	},
	access: {
		status: 'active',
		authentication: { provider: 'oauth', rotationDays: 60 },
		allowedRoles: ['admin', 'developer', 'auditor']
	},
	traffic: {
		rateLimit: { requests: 2500, window: '1m' },
		regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
	},
	notifications: {
		email: 'platform@example.com',
		slack: true,
		escalation: { afterMinutes: 15, channels: ['email', 'slack'] }
	},
	retention: { days: 90, archiveEnabled: true },
	compliance: { dataClassification: 'internal', reviewRequired: true }
}

function formatValue(value: JsonValue | undefined) {
	if (value === undefined) return '—'
	if (typeof value === 'string') return `"${value}"`
	return JSON.stringify(value)
}

function humanizePath(path: string) {
	const segment = path.split('.').pop() ?? path
	const arrayItem = segment.match(/^(.*)\[(\d+)\]$/)
	const label = (arrayItem?.[1] ?? segment)
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (letter) => letter.toUpperCase())
	return arrayItem
		? `${label || 'Array'} item ${Number(arrayItem[2]) + 1}`
		: label
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function collectDiffs(
	before: JsonValue,
	after: JsonValue,
	path = '',
	depth = 0
): DiffEntry[] {
	if (JSON.stringify(before) === JSON.stringify(after)) return []

	if (isJsonObject(before) && isJsonObject(after)) {
		const keys = new Set([...Object.keys(before), ...Object.keys(after)])
		return [...keys].flatMap((key) => {
			const nextPath = path ? `${path}.${key}` : key
			if (!(key in before))
				return [
					{
						path: nextPath,
						label: humanizePath(nextPath),
						type: 'added' as const,
						after: after[key],
						depth
					}
				]
			if (!(key in after))
				return [
					{
						path: nextPath,
						label: humanizePath(nextPath),
						type: 'removed' as const,
						before: before[key],
						depth
					}
				]
			return collectDiffs(before[key], after[key], nextPath, depth)
		})
	}

	if (Array.isArray(before) && Array.isArray(after)) {
		const length = Math.max(before.length, after.length)
		return Array.from({ length }, (_, index) => {
			const nextPath = `${path}[${index}]`
			if (index >= before.length) {
				return [
					{
						path: nextPath,
						label: humanizePath(nextPath),
						type: 'added' as const,
						after: after[index],
						depth
					}
				]
			}
			if (index >= after.length) {
				return [
					{
						path: nextPath,
						label: humanizePath(nextPath),
						type: 'removed' as const,
						before: before[index],
						depth
					}
				]
			}
			return collectDiffs(
				before[index],
				after[index],
				nextPath,
				depth + 1
			)
		}).flat()
	}

	return [
		{
			path,
			label: humanizePath(path),
			type: 'changed',
			before,
			after,
			depth
		}
	]
}

function ChangeIcon({ type }: { type: ChangeType }) {
	if (type === 'added')
		return <Plus aria-hidden='true' className='size-3.5' />
	if (type === 'removed')
		return <Minus aria-hidden='true' className='size-3.5' />
	return <CircleAlert aria-hidden='true' className='size-3.5' />
}

export function AuditLogDiff({
	before = previousSettings,
	after = currentSettings
}: {
	before?: JsonValue
	after?: JsonValue
}) {
	const diffs = useMemo(() => collectDiffs(before, after), [before, after])
	const changedCount = diffs.filter(
		(entry) => entry.type === 'changed'
	).length
	const addedCount = diffs.filter((entry) => entry.type === 'added').length
	const removedCount = diffs.filter(
		(entry) => entry.type === 'removed'
	).length

	return (
		<section className='min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:px-8'>
			<div className='mx-auto flex max-w-5xl flex-col gap-6'>
				<div className='grid gap-3 sm:grid-cols-3'>
					<SummaryCard
						label='Changed'
						count={changedCount}
						tone='changed'
					/>
					<SummaryCard
						label='Added'
						count={addedCount}
						tone='added'
					/>
					<SummaryCard
						label='Removed'
						count={removedCount}
						tone='removed'
					/>
				</div>

				<div className='overflow-hidden rounded-xl border border-border bg-background shadow-sm'>
					<div className='flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
						<div>
							<h2 className='font-medium'>Configuration diff</h2>
							<p className='mt-1 text-xs text-muted-foreground'>
								Only changed fields are shown.
							</p>
						</div>
						<span className='text-xs text-muted-foreground'>
							{diffs.length} changed fields
						</span>
					</div>
					<div className='divide-y divide-border'>
						{diffs.map((entry) => {
							return (
								<div
									key={entry.path}
									className='grid gap-3 px-4 py-4 sm:grid-cols-[minmax(150px,0.7fr)_1fr] sm:px-6'
								>
									<div
										className='flex min-w-0 items-start gap-2'
										style={{
											paddingLeft: `${entry.depth * 16}px`
										}}
									>
										<span
											className={cn(
												'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md',
												entry.type === 'added' &&
													'bg-emerald-100 text-emerald-700',
												entry.type === 'removed' &&
													'bg-red-100 text-red-700',
												entry.type === 'changed' &&
													'bg-amber-100 text-amber-700'
											)}
										>
											<ChangeIcon type={entry.type} />
										</span>
										<div className='min-w-0'>
											<p className='truncate text-sm font-medium'>
												{entry.label}
											</p>
											<p className='truncate font-mono text-xs text-muted-foreground'>
												{entry.path}
											</p>
										</div>
									</div>
									<div className='min-w-0 rounded-lg border border-border bg-muted/30 p-3'>
										<p className='mb-2 text-xs font-medium text-muted-foreground'>
											{entry.type === 'added'
												? `Added ${entry.label}`
												: entry.type === 'removed'
													? `Removed ${entry.label}`
													: `${entry.label} changed`}
										</p>
										<div className='grid gap-2 text-xs sm:grid-cols-2'>
											<ValueBlock
												label='Previous'
												value={formatValue(
													entry.before
												)}
												tone='removed'
											/>
											<ValueBlock
												label='Current'
												value={formatValue(entry.after)}
												tone='added'
											/>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				<p className='text-center text-xs text-muted-foreground'>
					Red values are previous data. Green values are the new data.
					Amber marks a field whose value changed.
				</p>
			</div>
		</section>
	)
}

function ValueBlock({
	label,
	value,
	tone
}: {
	label: string
	value: string
	tone: 'added' | 'removed'
}) {
	return (
		<div
			className={cn(
				'min-w-0 rounded-md border px-3 py-2',
				tone === 'removed'
					? 'border-red-200 bg-red-50/70'
					: 'border-emerald-200 bg-emerald-50/70'
			)}
		>
			<p className='mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
				{label}
			</p>
			<code className='block truncate font-mono text-xs'>{value}</code>
		</div>
	)
}

function SummaryCard({
	label,
	count,
	tone
}: {
	label: string
	count: number
	tone: ChangeType
}) {
	return (
		<div className='rounded-xl border border-border bg-background px-4 py-3 shadow-sm'>
			<div className='flex items-center justify-between'>
				<span className='text-sm text-muted-foreground'>{label}</span>
				<span
					className={cn(
						'rounded-full px-2 py-0.5 text-xs font-semibold',
						tone === 'added' && 'bg-emerald-100 text-emerald-700',
						tone === 'removed' && 'bg-red-100 text-red-700',
						tone === 'changed' && 'bg-amber-100 text-amber-700'
					)}
				>
					{tone === 'added' ? '+' : tone === 'removed' ? '−' : '~'}{' '}
					{count}
				</span>
			</div>
			<p className='mt-2 text-2xl font-semibold tabular-nums'>{count}</p>
		</div>
	)
}

export default AuditLogDiff
export type { JsonValue }
export { previousSettings, currentSettings }
