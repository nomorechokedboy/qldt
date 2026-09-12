import { useMemo } from 'react'
import useProvinces from '@/hooks/useProvinces'
import useWards from '@/hooks/useWards'

export default function ReviewStep({ values }: { values: any }) {
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
				Xem lại thông tin nhập liệu
			</h2>
			<div className='space-y-6 bg-muted/50 p-6 rounded-lg border'>
				{/* Personal Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						Thông tin cá nhân
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
						<p>
							<strong className='text-muted-foreground'>
								Họ và tên:
							</strong>{' '}
							{values.fullName}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Quê quán:
							</strong>{' '}
							{formatPlace(
								values.birthPlace,
								values.birthPlaceProvinceCode,
								values.birthPlaceWardCode
							)}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Trú quán:
							</strong>{' '}
							{formatPlace(
								values.address,
								values.addressProvinceCode,
								values.addressWardCode
							)}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Dân tộc:
							</strong>{' '}
							{values.ethnic}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Tôn giáo:
							</strong>{' '}
							{values.religion}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Trình độ học vấn:
							</strong>{' '}
							{values.educationLevel}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Tên trường:
							</strong>{' '}
							{values.schoolName}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Ngành:
							</strong>{' '}
							{values.major}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Phone:
							</strong>{' '}
							{values.phone}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Sinh nhật:
							</strong>{' '}
							{values.dob}
						</p>
					</div>
				</div>

				{/* Military Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						Thông tin quân nhân
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
						<p>
							<strong className='text-muted-foreground'>
								Ngày nhập ngũ:
							</strong>{' '}
							{values.enlistmentPeriod}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Đơn vị cũ:
							</strong>{' '}
							{values.previousUnit}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Chức vụ tại đơn vị cũ:
							</strong>{' '}
							{values.previousPosition}
						</p>
						<p>
							<strong className='text-muted-foreground'>
								Diện chính sách:
							</strong>{' '}
							{values.policyBeneficiaryGroup}
						</p>
					</div>
				</div>

				{/* Family Information */}
				<div>
					<h3 className='font-semibold mb-3 text-lg border-b border-border pb-2'>
						Thông tin gia đình
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Father */}
						<div>
							<h4 className='font-medium mb-2'>Cha</h4>
							<div className='space-y-1 text-sm'>
								<p>
									<strong className='text-muted-foreground'>
										Tên:
									</strong>{' '}
									{values.fatherName}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										SĐT:
									</strong>{' '}
									{values.fatherPhoneNumber}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										Nghề:
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
							<h4 className='font-medium mb-2'>Mẹ</h4>
							<div className='space-y-1 text-sm'>
								<p>
									<strong className='text-muted-foreground'>
										Tên:
									</strong>{' '}
									{values.motherName}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										SĐT:
									</strong>{' '}
									{values.motherPhoneNumber}
								</p>
								<p>
									<strong className='text-muted-foreground'>
										Nghề:
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
