import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import QrScanner from '@/components/QrScanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useInventorySession from '@/hooks/useInventorySession'
import { computeDiff } from '@/lib/diff'
import type { DiffStatus } from '@/lib/diff'
import { parseMaterialAssetTagPayload } from '@/lib/material-asset-tag'
import { buildResultsPayload } from '@/lib/payload'
import type { MaterialConditionName } from '@/lib/payload'
import { loadSession, saveResultsPayload } from '@/lib/storage'
import { cn } from '@/lib/utils'

const CONDITIONS: MaterialConditionName[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

const CONDITION_LABELS: Record<MaterialConditionName, string> = {
	good: 'Tốt',
	fair: 'Khá',
	needs_maintenance: 'Cần bảo dưỡng',
	damaged: 'Hư hỏng'
}

const COUNT_BADGE_CLASSES: Record<DiffStatus, string> = {
	matched: 'border-matched/40 bg-matched/10 text-matched',
	missing: 'border-missing/40 bg-missing/10 text-missing',
	condition_changed: 'border-changed/40 bg-changed/10 text-changed',
	extra: 'border-extra/40 bg-extra/10 text-extra'
}

const COUNT_LABELS: Record<DiffStatus, string> = {
	matched: 'Khớp',
	missing: 'Thiếu',
	condition_changed: 'Đổi t.trạng',
	extra: 'Phát sinh'
}

// Left-edge marker on each checklist row, using the same fixed status
// colors as the count badges above - lets the list be scanned by color,
// not just by reading the "Đã ghi nhận" line.
const ROW_STATUS_BAR: Record<DiffStatus, string> = {
	matched: 'border-l-matched',
	missing: 'border-l-missing',
	condition_changed: 'border-l-changed',
	extra: 'border-l-extra'
}

export const Route = createFileRoute('/checklist')({
	beforeLoad: () => {
		if (!loadSession()) {
			throw redirect({ to: '/' })
		}
	},
	component: ChecklistPage
})

function ChecklistPage() {
	const navigate = useNavigate()
	const { session, setSession } = useInventorySession()
	const [extraSerial, setExtraSerial] = useState('')
	const [signing, setSigning] = useState(false)
	// Scanning the printed asset QR tags is the default, fastest way to work
	// through a room's checklist - manual entry (tapping a condition per row,
	// or typing in an unexpected serial) is a fallback for assets that were
	// never tagged, or a tag that won't scan.
	const [mode, setMode] = useState<'scan' | 'manual'>('scan')
	const [tagScanError, setTagScanError] = useState<string | null>(null)

	const diff = useMemo(
		() =>
			session
				? computeDiff(session.challenge.expected, session.scans)
				: [],
		[session]
	)

	const counts = useMemo(() => {
		const c: Record<DiffStatus, number> = {
			matched: 0,
			missing: 0,
			extra: 0,
			condition_changed: 0
		}
		for (const item of diff) c[item.status]++
		return c
	}, [diff])

	const diffBySerial = useMemo(
		() => new Map(diff.map((d) => [d.serial, d])),
		[diff]
	)

	if (!session) return null

	function recordScan(serial: string, condition: MaterialConditionName) {
		if (!session) return
		setSession({
			...session,
			scans: {
				...session.scans,
				[serial]: { serial, observedCondition: condition }
			}
		})
	}

	function unmarkScan(serial: string) {
		if (!session) return
		const nextScans = { ...session.scans }
		delete nextScans[serial]
		setSession({ ...session, scans: nextScans })
	}

	function handleTagDecode(text: string) {
		const tag = parseMaterialAssetTagPayload(text)
		if (!tag) {
			setTagScanError('Mã QR không hợp lệ hoặc không phải mã khí tài.')
			return
		}
		setTagScanError(null)
		recordScan(tag.serial.toUpperCase(), tag.condition)
	}

	function handleAddExtra(condition: MaterialConditionName) {
		const serial = extraSerial.trim().toUpperCase()
		if (!serial) return
		recordScan(serial, condition)
		setExtraSerial('')
	}

	async function handleFinish() {
		if (!session) return
		setSigning(true)
		try {
			const results = Object.values(session.scans)
			const payload = await buildResultsPayload(
				session.challenge.key,
				session.challenge.sid,
				results
			)
			saveResultsPayload(payload)
			navigate({ to: '/results' })
		} finally {
			setSigning(false)
		}
	}

	function cancelSession() {
		setSession(null)
		navigate({ to: '/' })
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='bg-card border-border flex items-stretch justify-between rounded-md border'>
				<div className='flex flex-1 flex-col gap-0.5 border-r p-2.5'>
					<span className='text-muted-foreground text-[11px]'>
						Phòng
					</span>
					<span className='font-mono text-sm font-semibold'>
						{session.challenge.roomId}
					</span>
				</div>
				<div className='flex flex-1 flex-col gap-0.5 border-r p-2.5'>
					<span className='text-muted-foreground text-[11px]'>
						Phiên
					</span>
					<span className='font-mono text-sm font-semibold'>
						#{session.challenge.sid}
					</span>
				</div>
				<div className='flex flex-1 flex-col gap-0.5 p-2.5'>
					<span className='text-muted-foreground text-[11px]'>
						Vật tư
					</span>
					<span className='font-mono text-sm font-semibold'>
						{session.challenge.expected.length}
					</span>
				</div>
			</div>

			<div className='flex flex-wrap gap-2'>
				{(Object.keys(counts) as DiffStatus[]).map((status) => (
					<Badge
						key={status}
						variant='outline'
						className={cn(
							'rounded-sm',
							COUNT_BADGE_CLASSES[status]
						)}
					>
						{COUNT_LABELS[status]}: {counts[status]}
					</Badge>
				))}
			</div>

			<div className='flex gap-2'>
				<Button
					type='button'
					variant={mode === 'scan' ? 'default' : 'outline'}
					className='flex-1'
					onClick={() => {
						setMode('scan')
						setTagScanError(null)
					}}
				>
					Quét mã QR
				</Button>
				<Button
					type='button'
					variant={mode === 'manual' ? 'default' : 'outline'}
					className='flex-1'
					onClick={() => setMode('manual')}
				>
					Nhập thủ công
				</Button>
			</div>

			{mode === 'scan' && (
				<div className='flex flex-col gap-2'>
					<QrScanner onDecode={handleTagDecode} />
					{tagScanError && (
						<p className='text-destructive text-sm'>
							{tagScanError}
						</p>
					)}
				</div>
			)}

			<ul className='flex flex-col gap-2'>
				{session.challenge.expected.map((asset) => {
					const scan = session.scans[asset.serial]
					const rowStatus =
						diffBySerial.get(asset.serial)?.status ?? 'missing'
					return (
						<li
							key={asset.serial}
							className={cn(
								'bg-card flex flex-col gap-2 rounded-md border border-l-4 p-3',
								ROW_STATUS_BAR[rowStatus]
							)}
						>
							<div className='flex flex-col'>
								<span className='font-mono text-base font-semibold'>
									{asset.serial}
								</span>
								<span className='text-muted-foreground text-xs'>
									{asset.materialTypeName} - Dự kiến:{' '}
									{CONDITION_LABELS[asset.condition]}
								</span>
								{scan && (
									<span
										className={cn(
											'text-xs font-medium',
											rowStatus === 'condition_changed'
												? 'text-changed'
												: 'text-matched'
										)}
									>
										Đã ghi nhận:{' '}
										{
											CONDITION_LABELS[
												scan.observedCondition
											]
										}
									</span>
								)}
							</div>
							{mode === 'manual' ? (
								<div className='flex flex-wrap gap-1.5'>
									{CONDITIONS.map((c) => (
										<Button
											key={c}
											type='button'
											variant={
												scan?.observedCondition === c
													? 'default'
													: 'outline'
											}
											size='sm'
											className='min-w-[5.5rem] flex-1'
											onClick={() =>
												recordScan(asset.serial, c)
											}
										>
											{CONDITION_LABELS[c]}
										</Button>
									))}
									{scan && (
										<Button
											type='button'
											variant='link'
											size='sm'
											className='text-destructive h-auto self-start px-0'
											onClick={() =>
												unmarkScan(asset.serial)
											}
										>
											Bỏ đánh dấu
										</Button>
									)}
								</div>
							) : (
								scan && (
									<Button
										type='button'
										variant='link'
										size='sm'
										className='text-destructive h-auto self-start px-0'
										onClick={() => unmarkScan(asset.serial)}
									>
										Bỏ đánh dấu
									</Button>
								)
							)}
						</li>
					)
				})}
			</ul>

			{mode === 'manual' && (
				<div className='border-border flex flex-col gap-2 rounded-lg border border-dashed p-3'>
					<p className='text-muted-foreground text-sm'>
						Thêm số hiệu phát sinh (không có trong danh sách dự
						kiến)
					</p>
					<Input
						value={extraSerial}
						onChange={(e) => setExtraSerial(e.currentTarget.value)}
						placeholder='Số hiệu (VD: A808834)'
						className='font-mono uppercase'
					/>
					<div className='flex flex-wrap gap-1.5'>
						{CONDITIONS.map((c) => (
							<Button
								key={c}
								type='button'
								variant='outline'
								size='sm'
								className='min-w-[5.5rem] flex-1'
								onClick={() => handleAddExtra(c)}
								disabled={!extraSerial.trim()}
							>
								{CONDITION_LABELS[c]}
							</Button>
						))}
					</div>
				</div>
			)}

			{diff
				.filter((d) => d.status === 'extra')
				.map((d) => (
					<div
						key={d.serial}
						className='bg-card border-l-extra flex items-center justify-between rounded-md border border-l-4 p-3'
					>
						<div className='flex flex-col'>
							<span className='font-mono text-base font-semibold'>
								{d.serial}
							</span>
							<span className='text-muted-foreground text-xs'>
								Phát sinh -{' '}
								{d.observedCondition
									? CONDITION_LABELS[d.observedCondition]
									: ''}
							</span>
						</div>
						<Button
							type='button'
							variant='link'
							size='sm'
							className='text-destructive h-auto px-0'
							onClick={() => unmarkScan(d.serial)}
						>
							Xoá
						</Button>
					</div>
				))}

			<Button
				type='button'
				size='lg'
				onClick={handleFinish}
				disabled={signing}
			>
				{signing ? 'Đang tạo mã QR...' : 'Hoàn tất kiểm kê'}
			</Button>
			<Button type='button' variant='outline' onClick={cancelSession}>
				Huỷ, quét phiên khác
			</Button>
		</div>
	)
}
