import { useTranslation } from 'react-i18next'
import {
	CompactFrame,
	CoverFrame,
	Portrait
} from '@/components/student-record/cover-shell'
import {
	SectionList,
	SectionPills
} from '@/components/student-record/section-nav'
import {
	RECORD_SECTIONS,
	type SectionId
} from '@/components/student-record/sections'
import { getMediaUri } from '@/lib/utils'
import type { Student } from '@/types'
import { CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { positionName } from '@/lib/position-name'
import StudentActions from './actions'
import { PANELS } from './panels'
import StudentEditForm from '../student-edit-form'

interface StudentInfoProps {
	student: Student
	// Hides everything that changes the record.
	readOnly?: boolean
}

// Fills the two-pane dialog: the record cover on the left, one section of
// the record on the right.
export default function StudentInfo({
	student,
	readOnly = false
}: StudentInfoProps) {
	const { t } = useTranslation('student')
	const [sectionId, setSectionId] = useState<SectionId>(RECORD_SECTIONS[0].id)
	const [isEditing, setIsEditing] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const section =
		RECORD_SECTIONS.find((s) => s.id === sectionId) ?? RECORD_SECTIONS[0]
	const Panel = PANELS[section.id]

	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = 0
	}, [sectionId])

	const photoSrc = getMediaUri(student.avatar || '/avt.jpg')
	const summary = {
		fullName: student.fullName,
		rank: student.rank,
		position: positionName(student),
		unit: student.unit?.name
	}

	// The edit form used to open in its own nested Dialog here. Two Radix
	// Dialog Roots open at once can strand their shared body scroll-lock
	// counter above 0 when both close in quick succession (e.g. Escape,
	// Escape), freezing every click on the page — so editing now swaps
	// content inside this same Dialog instead. The first Escape while
	// editing only needs to return to the view, not close the surrounding
	// Dialog; stopping it here, before it bubbles to Radix's own
	// document-level listener, keeps that Escape from closing the Dialog
	// outright.
	function handleKeyDown(event: KeyboardEvent) {
		if (isEditing && event.key === 'Escape') {
			event.stopPropagation()
			setIsEditing(false)
		}
	}

	if (isEditing) {
		return (
			<div className='contents' onKeyDown={handleKeyDown}>
				<StudentEditForm
					student={student}
					onClose={() => setIsEditing(false)}
				/>
			</div>
		)
	}

	return (
		<div
			className='grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]'
			onKeyDown={handleKeyDown}
		>
			<CoverFrame
				summary={summary}
				photo={<Portrait src={photoSrc} className='w-36' />}
				badge={
					<>
						<p className='truncate pt-1 text-sm text-sidebar-foreground/70'>
							{t('info.studentId', {
								id: student.studentId || t('info.noStudentId')
							})}
						</p>
						{student.status === 'confirmed' && (
							<p className='flex items-center gap-1.5 pt-1 text-sm text-gold'>
								<CheckCircle className='size-4' aria-hidden />
								{t('info.confirmed')}
							</p>
						)}
					</>
				}
			>
				<SectionList current={sectionId} onSelect={setSectionId} />
			</CoverFrame>

			<div className='flex min-h-0 flex-col bg-card'>
				<CompactFrame
					title={student.fullName ?? t('info.title')}
					subtitle={t(`record.sections.${section.id}.label`)}
					photo={<Portrait src={photoSrc} />}
				>
					<SectionPills current={sectionId} onSelect={setSectionId} />
				</CompactFrame>

				<div
					ref={scrollRef}
					className='min-h-0 flex-1 overflow-y-auto px-4 py-5 no-scrollbar lg:px-8 lg:py-6'
				>
					<div className='mb-6 hidden lg:block'>
						<h2 className='font-serif text-2xl font-semibold'>
							{t(`record.sections.${section.id}.label`)}
						</h2>
						<p className='text-sm text-muted-foreground'>
							{t(`record.sections.${section.id}.hint`)}
						</p>
					</div>
					<div
						key={section.id}
						className='animate-in fade-in-0 duration-200 motion-reduce:animate-none'
					>
						<Panel student={student} />
					</div>
				</div>

				<footer className='flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3 lg:px-8'>
					<StudentActions
						student={student}
						readOnly={readOnly}
						onEdit={() => setIsEditing(true)}
					/>
				</footer>
			</div>
		</div>
	)
}
