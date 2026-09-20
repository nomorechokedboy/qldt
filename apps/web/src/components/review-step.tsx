import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useProvinces from '@/hooks/useProvinces'
import useWards from '@/hooks/useWards'

export default function ReviewStep({ values }: { values: any }) {
	const { t } = useTranslation('io')
	const { data: provinces = [] } = useProvinces()
	// Unfiltered - the review step doesn't know in advance which
	// province(s) the selected wards belong to, and the full ward list
	// is small enough (~3,300 rows) to resolve both place fields' codes
	// from a single fetch.
	const { data: wards = [] } = useWards(undefined, { enabled: true })

	const provinceNameByCode = useMemo(
		() => new Map(provinces.map((p) => [p.code, p.nameWithType])),
		[provinces]
	)
	const wardNameByCode = useMemo(
		() => new Map(wards.map((w) => [w.code, w.nameWithType])),
		[wards]
	)

	const formatPlace = (
		detail: string | undefined,
		provinceCode: string | undefined,
		wardCode: string | undefined
	) => {
		const parts = [
			detail,
			wardCode ? wardNameByCode.get(wardCode) : undefined,
			provinceCode ? provinceNameByCode.get(provinceCode) : undefined
		].filter(Boolean)
		return parts.length > 0 ? parts.join(', ') : '—'
	}

	return (
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold text-center mb-8'>
				{t('studentReview.title')}
			</h2>
			<div className='space-y-6 bg-muted/50 p-6 rounded-lg border'>
				{/* Personal Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						{t('studentReview.personal')}
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.fullName')}
							</strong>{' '}
							{values.fullName}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.birthPlace')}
							</strong>{' '}
							{formatPlace(
								values.birthPlace,
								values.birthPlaceProvinceCode,
								values.birthPlaceWardCode
							)}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.address')}
							</strong>{' '}
							{formatPlace(
								values.address,
								values.addressProvinceCode,
								values.addressWardCode
							)}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.ethnic')}
							</strong>{' '}
							{values.ethnic}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.religion')}
							</strong>{' '}
							{values.religion}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.educationLevel')}
							</strong>{' '}
							{values.educationLevel}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.schoolName')}
							</strong>{' '}
							{values.schoolName}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.major')}
							</strong>{' '}
							{values.major}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.phone')}
							</strong>{' '}
							{values.phone}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.dob')}
							</strong>{' '}
							{values.dob}
						</p>
					</div>
				</div>

				{/* Military Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						{t('studentReview.military')}
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.enlistmentPeriod')}
							</strong>{' '}
							{values.enlistmentPeriod}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.previousUnit')}
							</strong>{' '}
							{values.previousUnit}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t('studentReview.fields.previousPosition')}
							</strong>{' '}
							{values.previousPosition}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								{t(
									'studentReview.fields.policyBeneficiaryGroup'
								)}
							</strong>{' '}
							{values.policyBeneficiaryGroup}
						</p>
					</div>
				</div>

				{/* Family Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						{t('studentReview.family')}
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Father */}
						<div>
							<h4 className='font-medium mb-2'>
								{t('studentReview.father')}
							</h4>
							<div className='space-y-1 text-sm'>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.name')}
									</strong>{' '}
									{values.fatherName}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.phoneNumber')}
									</strong>{' '}
									{values.fatherPhoneNumber}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.job')}
									</strong>{' '}
									{values.fatherJob}
								</p>
								{/* <p>
                                                                        <strong className="text-muted-foreground">
                                                                                Địa
                                                                                chỉ
                                                                                CV:
                                                                        </strong>{' '}
                                                                        {
                                                                                values.fatherJobAdress
                                                                        }
                                                                </p> */}
							</div>
						</div>

						{/* Mother */}
						<div>
							<h4 className='font-medium mb-2'>
								{t('studentReview.mother')}
							</h4>
							<div className='space-y-1 text-sm'>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.name')}
									</strong>{' '}
									{values.motherName}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.phoneNumber')}
									</strong>{' '}
									{values.motherPhoneNumber}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										{t('studentReview.fields.job')}
									</strong>{' '}
									{values.motherJob}
								</p>
								{/* <p>
                                                                        <strong className="text-muted-foreground">
                                                                                Địa
                                                                                chỉ
                                                                                CV:
                                                                        </strong>{' '}
                                                                        {
                                                                                values.motherJobAdress
                                                                        }
                                                                </p> */}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
