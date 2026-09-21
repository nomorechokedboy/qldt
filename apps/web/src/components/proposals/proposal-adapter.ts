import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { ComponentType, ReactNode } from 'react'

// The parts of a proposal that every kind shares. A kind's own response type
// (rank promotion, activity status, ...) satisfies this structurally and adds
// its target and dates on top.
export interface ProposalTrooper {
	id: number
	itemStatus: string
	failureReason: string | null
	appliedAt: string | null
	student?: { fullName: string | null }
}

export interface ProposalRow {
	id: number
	status: string
	note: string | null
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

// Everything that differs between proposal kinds. The list/detail/reject UI is
// shared (see proposals-tab.tsx); a kind supplies its endpoints and the few
// fields that are specific to it. Must be a module-level constant: its `use*`
// members are called as hooks on every render.
export interface ProposalAdapter<TRow extends ProposalRow> {
	// Picks the `rank.*` / `activity.*` i18n keys.
	kind: 'rank' | 'activity'
	permissionPrefix: 'rank_promotion_proposals' | 'activity_status_proposals'
	useList: (status: string | undefined) => {
		data: TRow[] | undefined
		isLoading: boolean
		error: unknown
		refetch: () => unknown
	}
	useApprove: () => Mutation<number>
	useCancel: () => Mutation<number>
	useReject: () => Mutation<{ id: number; reason: string }>
	CreateForm: ComponentType<{ onSuccess: () => void }>
	// The column showing what the proposal is asking for.
	targetColumn: (t: TFunction<'proposals'>) => ColumnDef<TRow>
	// Detail sheet: the target row, shown after the unit.
	renderTarget: (row: TRow, t: TFunction<'proposals'>) => ReactNode
	// Detail sheet: the date row(s), shown after the status.
	renderDates: (row: TRow, t: TFunction<'proposals'>) => ReactNode
	// Detail sheet, per trooper: what the trooper gets, before "applied at".
	renderTrooperMeta: (
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
