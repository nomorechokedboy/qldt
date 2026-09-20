import { useTranslation } from 'react-i18next'
import { useStore } from '@tanstack/react-form'
import ChildrenInfo from '@/components/children-info'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import SiblingInfo from '@/components/sibling-info'
import type { StudentFormValues } from './form-values'
import StudentField from './student-field'
import { useStudentForm } from './student-form-context'

function ParentSection({ prefix }: { prefix: 'father' | 'mother' }) {
	const { t } = useTranslation('student')

	return (
		<RecordSection title={t(`sections.${prefix}`)}>
			<RecordGrid columns={1}>
				<StudentField name={`${prefix}Name`} label={t('fields.name')} />
				<StudentField
					name={`${prefix}Dob`}
					label={t('fields.dob')}
					kind='date'
				/>
				<StudentField name={`${prefix}Job`} label={t('fields.job')} />
				<StudentField
					name={`${prefix}PhoneNumber`}
					label={t('fields.phone')}
				/>
			</RecordGrid>
		</RecordSection>
	)
}

export default function FamilyTab() {
	const { t } = useTranslation('student')
	const form = useStudentForm()
	const isMarried = useStore(
		form.store,
		(s: { values: StudentFormValues }) => s.values.isMarried
	)
	const childCount = useStore(
		form.store,
		(s: { values: StudentFormValues }) =>
			s.values.childrenInfos?.length ?? 0
	)
	const siblingCount = useStore(
		form.store,
		(s: { values: StudentFormValues }) => s.values.siblings?.length ?? 0
	)

	return (
		<StepBody>
			<RecordGrid>
				<ParentSection prefix='father' />
				<ParentSection prefix='mother' />
			</RecordGrid>

			<RecordSection title={t('sections.spouse')}>
				<RecordGrid>
					<StudentField
						name='isMarried'
						label={t('recordFields.married')}
						kind='switch'
					/>
					{isMarried && (
						<>
							<StudentField
								name='spouseName'
								label={t('recordFields.spouseName')}
							/>
							<StudentField
								name='spouseDob'
								label={t('fields.dob')}
								kind='date'
							/>
							<StudentField
								name='spouseJob'
								label={t('fields.job')}
							/>
							<StudentField
								name='spousePhoneNumber'
								label={t('recordFields.spousePhone')}
							/>
						</>
					)}
				</RecordGrid>
			</RecordSection>

			<RecordSection
				title={t('sections.childrenCount', { count: childCount })}
			>
				<ChildrenInfo form={form} />
			</RecordSection>

			<RecordSection
				title={t('sections.siblingsCount', { count: siblingCount })}
			>
				<SiblingInfo form={form} />
			</RecordSection>

			<RecordSection title={t('sections.familyBackground')}>
				<RecordGrid columns={3}>
					<StudentField
						name='familyBackground'
						label={t('recordFields.familyBackground')}
					/>
					<StudentField
						name='familySize'
						label={t('recordFields.familySize')}
						kind='number'
					/>
					<StudentField
						name='familyBirthOrder'
						label={t('recordFields.birthOrder')}
					/>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}
