import type { LucideIcon } from 'lucide-react'
import { Award, GraduationCap, Shield, User, Users } from 'lucide-react'

export type SectionId =
	| 'personal'
	| 'military'
	| 'education'
	| 'family'
	| 'history'

export interface RecordSectionMeta {
	id: SectionId
	icon: LucideIcon
}

// The parts of a personnel record, in the order both the form and the
// read-only view present them.
export const RECORD_SECTIONS: RecordSectionMeta[] = [
	{
		id: 'personal',
		icon: User
	},
	{
		id: 'military',
		icon: Shield
	},
	{
		id: 'education',
		icon: GraduationCap
	},
	{
		id: 'family',
		icon: Users
	},
	{
		id: 'history',
		icon: Award
	}
]
