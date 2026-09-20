import { useTranslation } from 'react-i18next'
import { RecordSection, StepBody } from '@/components/record-section'
import { politicalOptions } from '@/data/political-status'
import { positionName } from '@/lib/position-name'
import type { Student } from '@/types'
import type { ComponentType } from 'react'
import type { SectionId } from '@/components/student-record/sections'
import { dateText, EmptyNote, Fact, Facts } from './fact'

type Panel = ComponentType<{ student: Student }>

function PersonalPanel({ student }: { student: Student }) {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<RecordSection title={t('sections.identity')}>
				<Facts>
					<Fact
						label={t('fields.fullName')}
						value={student.fullName}
					/>
					<Fact
						label={t('recordFields.studentId')}
						value={student.studentId}
					/>
					<Fact
						label={t('fields.dob')}
						value={dateText(student.dob)}
					/>
					<Fact label={t('fields.phone')} value={student.phone} />
				</Facts>
			</RecordSection>
			<RecordSection title={t('sections.ethnicityReligion')}>
				<Facts>
					<Fact label={t('fields.ethnic')} value={student.ethnic} />
					<Fact
						label={t('fields.religion')}
						value={student.religion}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title={t('sections.places')}>
				<Facts>
					<Fact
						label={t('sections.birthPlaceLabel')}
						value={student.birthPlace}
					/>
					<Fact
						label={t('sections.addressLabel')}
						value={student.address}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function MilitaryPanel({ student }: { student: Student }) {
	const { t } = useTranslation('student')
	const politicalOrg = politicalOptions.find(
		(o) => o.value === student.politicalOrg
	)?.label

	return (
		<StepBody>
			<RecordSection title={t('sections.military')}>
				<Facts columns={3}>
					<Fact label={t('fields.rank')} value={student.rank} />
					<Fact
						label={t('fields.position')}
						value={positionName(student)}
					/>
					<Fact label={t('fields.unit')} value={student.unit?.name} />
					<Fact
						label={t('fields.enlistmentDate')}
						value={student.enlistmentPeriod}
					/>
					<Fact
						label={t('fields.previousUnit')}
						value={student.previousUnit}
					/>
					<Fact
						label={t('fields.previousPosition')}
						value={student.previousPosition}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title={t('sections.politics')}>
				<Facts columns={3}>
					<Fact
						label={t('recordFields.politicalOrg')}
						value={politicalOrg ?? student.politicalOrg}
					/>
					<Fact
						label={t('fields.youthJoinDate')}
						value={dateText(student.politicalOrgOfficialDate)}
					/>
					<Fact
						label={t('fields.partyJoinDate')}
						value={dateText(student.cpvOfficialAt)}
					/>
					<Fact label={t('fields.cpvId')} value={student.cpvId} />
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function EducationPanel({ student }: { student: Student }) {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<RecordSection title={t('sections.education')}>
				<Facts columns={3}>
					<Fact
						label={t('recordFields.schoolName')}
						value={student.schoolName}
					/>
					<Fact
						label={t('recordFields.major')}
						value={student.major}
					/>
					<Fact
						label={t('recordFields.educationLevel')}
						value={student.educationLevel}
					/>
					<Fact
						label={t('fields.graduated')}
						value={
							student.isGraduated
								? t('info.yes')
								: t('info.notYet')
						}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title={t('sections.skillsAndPolicy')}>
				<Facts columns={3}>
					<Fact label={t('fields.talent')} value={student.talent} />
					<Fact
						label={t('fields.shortcoming')}
						value={student.shortcoming}
					/>
					<Fact
						label={t('fields.policyGroup')}
						value={student.policyBeneficiaryGroup}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function ParentBlock({
	prefix,
	name,
	dob,
	job,
	phone
}: {
	prefix: 'father' | 'mother'
	name?: string | null
	dob?: string | null
	job?: string | null
	phone?: string | null
}) {
	const { t } = useTranslation('student')

	return (
		<RecordSection title={t(`sections.${prefix}`)}>
			<Facts columns={1}>
				<Fact label={t('fields.name')} value={name} />
				<Fact label={t('fields.dob')} value={dateText(dob)} />
				<Fact label={t('fields.job')} value={job} />
				<Fact label={t('fields.phone')} value={phone} />
			</Facts>
		</RecordSection>
	)
}

function PersonList({
	people,
	empty
}: {
	people?: { fullName: string; dob: string }[]
	empty: string
}) {
	const { t } = useTranslation('student')

	if (!people?.length) return <EmptyNote>{empty}</EmptyNote>

	return (
		<ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
			{people.map((person, index) => (
				<li
					key={`${person.fullName}-${index}`}
					className='rounded-md border p-3'
				>
					<Facts columns={1}>
						<Fact
							label={t('fields.name')}
							value={person.fullName}
						/>
						<Fact
							label={t('fields.dob')}
							value={dateText(person.dob)}
						/>
					</Facts>
				</li>
			))}
		</ul>
	)
}

function FamilyPanel({ student }: { student: Student }) {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<div className='grid gap-x-5 gap-y-8 sm:grid-cols-2'>
				<ParentBlock
					prefix='father'
					name={student.fatherName}
					dob={student.fatherDob}
					job={student.fatherJob}
					phone={student.fatherPhoneNumber}
				/>
				<ParentBlock
					prefix='mother'
					name={student.motherName}
					dob={student.motherDob}
					job={student.motherJob}
					phone={student.motherPhoneNumber}
				/>
			</div>
			<RecordSection title={t('sections.spouse')}>
				<Facts>
					<Fact
						label={t('recordFields.status')}
						value={
							student.isMarried
								? t('info.married')
								: t('info.single')
						}
					/>
					{student.isMarried && (
						<>
							<Fact
								label={t('recordFields.spouseName')}
								value={student.spouseName}
							/>
							<Fact
								label={t('fields.dob')}
								value={dateText(student.spouseDob)}
							/>
							<Fact
								label={t('fields.job')}
								value={student.spouseJob}
							/>
							<Fact
								label={t('recordFields.spousePhone')}
								value={student.spousePhoneNumber}
							/>
						</>
					)}
				</Facts>
			</RecordSection>
			<RecordSection
				title={t('sections.childrenCount', {
					count: student.childrenInfos?.length ?? 0
				})}
			>
				<PersonList
					people={student.childrenInfos}
					empty={t('info.noChildren')}
				/>
			</RecordSection>
			<RecordSection
				title={t('sections.siblingsCount', {
					count: student.siblings?.length ?? 0
				})}
			>
				<PersonList
					people={student.siblings}
					empty={t('info.noSiblings')}
				/>
			</RecordSection>
			<RecordSection title={t('sections.familyBackground')}>
				<Facts columns={3}>
					<Fact
						label={t('recordFields.familyBackground')}
						value={student.familyBackground}
					/>
					<Fact
						label={t('recordFields.familySize')}
						value={student.familySize}
					/>
					<Fact
						label={t('recordFields.birthOrder')}
						value={student.familyBirthOrder}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function HistoryPanel({ student }: { student: Student }) {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<RecordSection title={t('sections.history')}>
				<Facts>
					<Fact
						label={t('recordFields.achievement')}
						value={student.achievement}
					/>
					<Fact
						label={t('fields.discipline')}
						value={student.disciplinaryHistory}
					/>
				</Facts>
			</RecordSection>
			<RecordSection
				title={t('sections.contact')}
				hint={t('sections.contactHint')}
			>
				<Facts columns={3}>
					<Fact
						label={t('fields.name')}
						value={student.contactPerson?.name}
					/>
					<Fact
						label={t('fields.phone')}
						value={student.contactPerson?.phoneNumber}
					/>
					<Fact
						label={t('fields.address')}
						value={student.contactPerson?.address}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title={t('sections.documents')}>
				<Facts columns={1}>
					<Fact
						label={t('fields.documents')}
						value={student.relatedDocumentations}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

export const PANELS: Record<SectionId, Panel> = {
	personal: PersonalPanel,
	military: MilitaryPanel,
	education: EducationPanel,
	family: FamilyPanel,
	history: HistoryPanel
}
