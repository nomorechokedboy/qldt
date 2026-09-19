import { RecordSection, StepBody } from '@/components/record-section'
import { politicalOptions } from '@/data/political-status'
import type { Student } from '@/types'
import type { ComponentType } from 'react'
import type { SectionId } from '@/components/student-record/sections'
import { dateText, EmptyNote, Fact, Facts } from './fact'

type Panel = ComponentType<{ student: Student }>

function PersonalPanel({ student }: { student: Student }) {
	return (
		<StepBody>
			<RecordSection title='Họ tên và nhận dạng'>
				<Facts>
					<Fact label='Họ và tên' value={student.fullName} />
					<Fact label='Mã quân nhân' value={student.studentId} />
					<Fact label='Ngày sinh' value={dateText(student.dob)} />
					<Fact label='Số điện thoại' value={student.phone} />
				</Facts>
			</RecordSection>
			<RecordSection title='Dân tộc và tôn giáo'>
				<Facts>
					<Fact label='Dân tộc' value={student.ethnic} />
					<Fact label='Tôn giáo' value={student.religion} />
				</Facts>
			</RecordSection>
			<RecordSection title='Quê quán và trú quán'>
				<Facts>
					<Fact label='Quê quán' value={student.birthPlace} />
					<Fact label='Trú quán' value={student.address} />
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function MilitaryPanel({ student }: { student: Student }) {
	const politicalOrg = politicalOptions.find(
		(o) => o.value === student.politicalOrg
	)?.label

	return (
		<StepBody>
			<RecordSection title='Quân sự'>
				<Facts columns={3}>
					<Fact label='Cấp bậc' value={student.rank} />
					<Fact label='Chức vụ' value={student.position} />
					<Fact label='Đơn vị' value={student.unit?.name} />
					<Fact
						label='Ngày nhập ngũ'
						value={student.enlistmentPeriod}
					/>
					<Fact label='Đơn vị cũ' value={student.previousUnit} />
					<Fact label='Chức vụ cũ' value={student.previousPosition} />
				</Facts>
			</RecordSection>
			<RecordSection title='Chính trị'>
				<Facts columns={3}>
					<Fact
						label='Tổ chức'
						value={politicalOrg ?? student.politicalOrg}
					/>
					<Fact
						label='Ngày vào Đoàn'
						value={dateText(student.politicalOrgOfficialDate)}
					/>
					<Fact
						label='Ngày vào Đảng'
						value={dateText(student.cpvOfficialAt)}
					/>
					<Fact label='Số thẻ Đảng' value={student.cpvId} />
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function EducationPanel({ student }: { student: Student }) {
	return (
		<StepBody>
			<RecordSection title='Học vấn'>
				<Facts columns={3}>
					<Fact label='Trường' value={student.schoolName} />
					<Fact label='Chuyên ngành' value={student.major} />
					<Fact label='Trình độ' value={student.educationLevel} />
					<Fact
						label='Đã tốt nghiệp'
						value={student.isGraduated ? 'Có' : 'Chưa'}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title='Kỹ năng và chính sách'>
				<Facts columns={3}>
					<Fact label='Sở trường' value={student.talent} />
					<Fact label='Sở đoản' value={student.shortcoming} />
					<Fact
						label='Đối tượng chính sách'
						value={student.policyBeneficiaryGroup}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function ParentBlock({
	title,
	name,
	dob,
	job,
	phone
}: {
	title: string
	name?: string | null
	dob?: string | null
	job?: string | null
	phone?: string | null
}) {
	return (
		<RecordSection title={title}>
			<Facts columns={1}>
				<Fact label='Họ tên' value={name} />
				<Fact label='Ngày sinh' value={dateText(dob)} />
				<Fact label='Nghề nghiệp' value={job} />
				<Fact label='Số điện thoại' value={phone} />
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
	if (!people?.length) return <EmptyNote>{empty}</EmptyNote>

	return (
		<ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
			{people.map((person, index) => (
				<li
					key={`${person.fullName}-${index}`}
					className='rounded-md border p-3'
				>
					<Facts columns={1}>
						<Fact label='Họ tên' value={person.fullName} />
						<Fact label='Ngày sinh' value={dateText(person.dob)} />
					</Facts>
				</li>
			))}
		</ul>
	)
}

function FamilyPanel({ student }: { student: Student }) {
	return (
		<StepBody>
			<div className='grid gap-x-5 gap-y-8 sm:grid-cols-2'>
				<ParentBlock
					title='Cha'
					name={student.fatherName}
					dob={student.fatherDob}
					job={student.fatherJob}
					phone={student.fatherPhoneNumber}
				/>
				<ParentBlock
					title='Mẹ'
					name={student.motherName}
					dob={student.motherDob}
					job={student.motherJob}
					phone={student.motherPhoneNumber}
				/>
			</div>
			<RecordSection title='Vợ/chồng'>
				<Facts>
					<Fact
						label='Tình trạng'
						value={student.isMarried ? 'Đã kết hôn' : 'Độc thân'}
					/>
					{student.isMarried && (
						<>
							<Fact
								label='Họ tên vợ/chồng'
								value={student.spouseName}
							/>
							<Fact
								label='Ngày sinh'
								value={dateText(student.spouseDob)}
							/>
							<Fact
								label='Nghề nghiệp'
								value={student.spouseJob}
							/>
							<Fact
								label='SĐT vợ/chồng'
								value={student.spousePhoneNumber}
							/>
						</>
					)}
				</Facts>
			</RecordSection>
			<RecordSection
				title={`Con (${student.childrenInfos?.length ?? 0})`}
			>
				<PersonList
					people={student.childrenInfos}
					empty='Chưa có thông tin con cái'
				/>
			</RecordSection>
			<RecordSection
				title={`Anh, chị, em ruột (${student.siblings?.length ?? 0})`}
			>
				<PersonList
					people={student.siblings}
					empty='Chưa có thông tin anh chị em'
				/>
			</RecordSection>
			<RecordSection title='Hoàn cảnh gia đình'>
				<Facts columns={3}>
					<Fact
						label='Hoàn cảnh gia đình'
						value={student.familyBackground}
					/>
					<Fact
						label='Số lượng thành viên'
						value={student.familySize}
					/>
					<Fact
						label='Con thứ mấy'
						value={student.familyBirthOrder}
					/>
				</Facts>
			</RecordSection>
		</StepBody>
	)
}

function HistoryPanel({ student }: { student: Student }) {
	return (
		<StepBody>
			<RecordSection title='Lịch sử'>
				<Facts>
					<Fact label='Khen thưởng' value={student.achievement} />
					<Fact label='Kỷ luật' value={student.disciplinaryHistory} />
				</Facts>
			</RecordSection>
			<RecordSection
				title='Người báo tin'
				hint='Người cần liên lạc khi có việc của quân nhân.'
			>
				<Facts columns={3}>
					<Fact label='Họ tên' value={student.contactPerson?.name} />
					<Fact
						label='Số điện thoại'
						value={student.contactPerson?.phoneNumber}
					/>
					<Fact
						label='Địa chỉ'
						value={student.contactPerson?.address}
					/>
				</Facts>
			</RecordSection>
			<RecordSection title='Tài liệu'>
				<Facts columns={1}>
					<Fact
						label='Hồ sơ đi kèm'
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
