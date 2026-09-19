import type { ComponentType } from 'react'
import type { SectionId } from '@/components/student-record/sections'
import EducationTab from './education-tab'
import FamilyTab from './family-tab'
import HistoryTab from './history-tab'
import MilitaryTab from './military-tab'
import PersonalTab from './personal-tab'

export const PANELS: Record<SectionId, ComponentType> = {
	personal: PersonalTab,
	military: MilitaryTab,
	education: EducationTab,
	family: FamilyTab,
	history: HistoryTab
}
