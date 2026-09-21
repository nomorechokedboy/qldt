import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { ComponentType, ReactNode } from 'react'

// The parts of a request that every kind shares. A kind's own response type
// (rank promotion, activity status, transfer, ...) satisfies this structurally
// and adds its target, dates and so on on top.
export interface ProposalTrooper {
	id: number
	itemStatus: string
	failureReason: string | null
	appliedAt?: string | null
	student?: { fullName: string | null }
}

export interface ProposalRow {
	id: number
	status: string
	note?: string | null
	rejectionReason: string | null
	createdAt: string
	canDecide: boolean
	unit?: { name: string }
	requestedBy?: { id: number; displayName: string }
	approver?: { displayName: string }
	troopers?: ProposalTrooper[]
}

export type TrooperOf<TRow extends ProposalRow> = NonNullable<
	TRow['troopers']
>[number]

interface Mutation<TVariables> {
	mutateAsync: (variables: TVariables) => Promise<unknown>
	isPending: boolean
}

// An extra per-row button (e.g. exporting a handover report), shown when
// `isVisible` says so. `run` handles its own failure.
export interface ExtraRowAction<TRow> {
	label: string
	isVisible: (row: TRow) => boolean
	run: (id: number) => void
	isPending: boolean
}

// Everything that differs between proposal kinds. The list/detail/reject UI is
// shared (see proposals-tab.tsx); a kind supplies its endpoints and the few
// fields that are specific to it. Must be a module-level constant: its `use*`
// members are called as hooks on every render.
export interface ProposalAdapter<TRow extends ProposalRow> {
	// Picks the `rank.*` / `activity.*` / `transfer.*` i18n keys.
	kind: 'rank' | 'activity' | 'transfer'
	permissionPrefix:
		| 'rank_promotion_proposals'
		| 'activity_status_proposals'
		| 'transfer_requests'
	// Label of the requester (defaults to `common.requestedBy`).
	requestedByKey?: 'common.requestedBy' | 'transfer.requestedBy'
	useList: (status: string | undefined) => {
		data: TRow[] | undefined
		isLoading: boolean
		error: unknown
		refetch: () => unknown
	}
	useApprove: () => Mutation<number>
	useCancel: () => Mutation<number>
	useReject: () => Mutation<{ id: number; reason: string }>
	// Called as a hook on every render.
	useExtraAction?: () => ExtraRowAction<TRow> | null
	CreateForm: ComponentType<{ onSuccess: () => void }>
	// The columns between the creation date and the requester: what the
	// request is about and what it asks for.
	middleColumns: (t: TFunction<'proposals'>) => ColumnDef<TRow>[]
	// Detail sheet: the leading rows, before the requester.
	renderLead: (row: TRow, t: TFunction<'proposals'>) => ReactNode
	// Detail sheet: the date row(s), shown after the status.
	renderDates?: (row: TRow, t: TFunction<'proposals'>) => ReactNode
	// Detail sheet: sections after the troopers.
	renderExtraSections?: (row: TRow, t: TFunction<'proposals'>) => ReactNode
	// Detail sheet, per trooper: what the trooper gets, before "applied at".
	renderTrooperMeta?: (
		row: TRow,
		trooper: TrooperOf<TRow>,
		t: TFunction<'proposals'>
	) => ReactNode
	// Detail sheet, per trooper: anything after "applied at".
	renderTrooperEnd?: (
		trooper: TrooperOf<TRow>,
		t: TFunction<'proposals'>
	) => ReactNode
}
