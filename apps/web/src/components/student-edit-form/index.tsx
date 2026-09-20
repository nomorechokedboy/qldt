import { Button } from '@/components/ui/button'
import {
	CompactHeader,
	CoverShell
} from '@/components/student-record/cover-shell'
import { getMediaUri } from '@/lib/utils'
import type { Student } from '@/types'
import { useEffect, useRef, useState } from 'react'
import {
	SectionList,
	SectionPills
} from '@/components/student-record/section-nav'
import {
	RECORD_SECTIONS,
	type SectionId
} from '@/components/student-record/sections'
import { PANELS } from './sections'
import { positionName } from '@/lib/position-name'
import { StudentFormProvider } from './student-form-context'
import useStudentEditForm from './use-student-edit-form'

interface StudentEditFormProps {
	student: Student
	onClose?: () => void
}

const FORM_ID = 'studentEditForm'

// Fills the two-pane dialog: the record cover on the left, one section of
// the form on the right.
export default function StudentEditForm({
	student,
	onClose
}: StudentEditFormProps) {
	const { form, isPending } = useStudentEditForm(student, onClose)
	const [sectionId, setSectionId] = useState<SectionId>(RECORD_SECTIONS[0].id)
	const scrollRef = useRef<HTMLFormElement>(null)
	const section =
		RECORD_SECTIONS.find((s) => s.id === sectionId) ?? RECORD_SECTIONS[0]

	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = 0
	}, [sectionId])

	const Panel = PANELS[section.id]

	const cover = {
		form,
		photoField: 'avatarFile',
		currentSrc: student.avatar ? getMediaUri(student.avatar) : undefined,
		fallback: { position: positionName(student), unit: student.unit?.name }
	}

	return (
		<StudentFormProvider value={form}>
			<div className='grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]'>
				<CoverShell {...cover}>
					<SectionList current={sectionId} onSelect={setSectionId} />
				</CoverShell>

				<div className='flex min-h-0 flex-col bg-card'>
					<CompactHeader
						{...cover}
						title={student.fullName ?? 'Chỉnh sửa quân nhân'}
						subtitle={section.label}
					>
						<SectionPills
							current={sectionId}
							onSelect={setSectionId}
						/>
					</CompactHeader>

					<form
						ref={scrollRef}
						id={FORM_ID}
						onSubmit={(e) => {
							e.preventDefault()
							form.handleSubmit()
						}}
						className='min-h-0 flex-1 overflow-y-auto px-4 py-5 no-scrollbar lg:px-8 lg:py-6 [&_label]:text-sm [&_label]:font-medium'
					>
						<div className='mb-6 hidden lg:block'>
							<h2 className='font-serif text-2xl font-semibold'>
								{section.label}
							</h2>
							<p className='text-sm text-muted-foreground'>
								{section.hint}
							</p>
						</div>
						<div
							key={section.id}
							className='animate-in fade-in-0 duration-200 motion-reduce:animate-none'
						>
							<Panel />
						</div>
					</form>

					<footer className='flex items-center justify-end gap-2 border-t px-4 py-3 lg:px-8'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
						>
							Hủy
						</Button>
						<Button
							type='submit'
							form={FORM_ID}
							disabled={isPending}
						>
							{isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</footer>
				</div>
			</div>
		</StudentFormProvider>
	)
}
