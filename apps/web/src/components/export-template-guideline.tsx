import { DownloadExampleExportTemplate } from '@/api'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import type { ExportResourceType } from '@/types'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const TROOPER_RAW_FIELDS: { field: string; description: string }[] = [
	{ field: 'fullName', description: 'Họ và tên' },
	{ field: 'dob', description: 'Ngày sinh' },
	{ field: 'rank', description: 'Cấp bậc' },
	{ field: 'position', description: 'Chức vụ' },
	{ field: 'previousUnit', description: 'Đơn vị cũ' },
	{ field: 'previousPosition', description: 'Chức vụ cũ' },
	{ field: 'birthPlace', description: 'Quê quán' },
	{ field: 'address', description: 'Trú quán' },
	{ field: 'enlistmentPeriod', description: 'Thời gian nhập ngũ' },
	{ field: 'ethnic', description: 'Dân tộc' },
	{ field: 'religion', description: 'Tôn giáo' },
	{ field: 'educationLevel', description: 'Học vấn' },
	{ field: 'schoolName', description: 'Tên trường' },
	{ field: 'major', description: 'Chuyên ngành' },
	{ field: 'isGraduated', description: "Đã tốt nghiệp ('Có'/'Không')" },
	{ field: 'phone', description: 'Số điện thoại' },
	{
		field: 'policyBeneficiaryGroup',
		description: 'Đối tượng chính sách'
	},
	{
		field: 'politicalOrg',
		description: "Đoàn/Đảng ('hcyu' hoặc 'cpv')"
	},
	{
		field: 'politicalOrgOfficialDate',
		description: 'Ngày vào Đoàn chính thức'
	},
	{ field: 'cpvId', description: 'Số thẻ Đảng' },
	{ field: 'cpvOfficialAt', description: 'Ngày vào Đảng chính thức' },
	{ field: 'shortcoming', description: 'Khuyết điểm' },
	{ field: 'talent', description: 'Tài năng' },
	{ field: 'fatherName', description: 'Họ tên bố' },
	{ field: 'fatherJob', description: 'Nghề nghiệp của bố' },
	{ field: 'fatherPhoneNumber', description: 'SĐT bố' },
	{ field: 'motherName', description: 'Họ tên mẹ' },
	{ field: 'motherJob', description: 'Nghề nghiệp của mẹ' },
	{ field: 'motherPhoneNumber', description: 'SĐT mẹ' },
	{ field: 'isMarried', description: "Đã kết hôn ('Có'/'Không')" },
	{ field: 'spouseName', description: 'Họ tên vợ/chồng' },
	{ field: 'spouseJob', description: 'Nghề nghiệp vợ/chồng' },
	{ field: 'spousePhoneNumber', description: 'SĐT vợ/chồng' },
	{ field: 'familySize', description: 'Số nhân khẩu' },
	{ field: 'familyBackground', description: 'Thành phần gia đình' },
	{ field: 'achievement', description: 'Thành tích' },
	{ field: 'disciplinaryHistory', description: 'Kỷ luật' },
	{ field: 'studentId', description: 'Mã học viên' },
	{
		field: 'status',
		description: "Trạng thái ('pending' hoặc 'confirmed')"
	},
	{ field: 'class.name', description: 'Tên tiểu đội' },
	{ field: 'unit.name', description: 'Tên đơn vị' },
	{
		field: 'childrenInfos',
		description: 'Danh sách con (mảng {fullName, dob})'
	},
	{
		field: 'siblings',
		description: 'Danh sách anh/chị/em (mảng {fullName, dob})'
	},
	{
		field: 'contactPerson',
		description: 'Người liên hệ ({name, phoneNumber, address})'
	}
]

const LETTERHEAD_VARIABLES: { variable: string; description: string }[] = [
	{ variable: '{unitName}', description: 'Tên đơn vị' },
	{ variable: '{underUnitName}', description: 'Tên đơn vị trực thuộc' },
	{ variable: '{city}', description: 'Địa danh' },
	{ variable: '{day}', description: 'Ngày lập báo cáo' },
	{ variable: '{month}', description: 'Tháng lập báo cáo' },
	{ variable: '{year}', description: 'Năm lập báo cáo' },
	{ variable: '{reportTitle}', description: 'Tiêu đề báo cáo' },
	{ variable: '{commanderPosition}', description: 'Chức vụ người chỉ huy' },
	{ variable: '{commanderRank}', description: 'Cấp bậc người chỉ huy' },
	{ variable: '{commanderName}', description: 'Họ tên người chỉ huy' }
]

export interface ExportTemplateGuidelineProps {
	resourceType: ExportResourceType
}

export function ExportTemplateGuideline({
	resourceType
}: ExportTemplateGuidelineProps) {
	const [isDownloading, setIsDownloading] = useState(false)

	async function handleDownloadExample() {
		setIsDownloading(true)
		try {
			const resp = await DownloadExampleExportTemplate(resourceType)
			const blob = await resp.blob()
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = 'mau-vi-du.docx'

			document.body.appendChild(link)
			link.click()

			document.body.removeChild(link)
			URL.revokeObjectURL(link.href)
		} catch (err) {
			console.error('handleDownloadExample error', err)
			toast.error('Không thể tải mẫu ví dụ, đã có lỗi xảy ra!')
		} finally {
			setIsDownloading(false)
		}
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center justify-between rounded-md border p-4'>
				<div>
					<p className='font-medium'>Mẫu ví dụ</p>
					<p className='text-sm text-muted-foreground'>
						Tải mẫu docx đã sử dụng sẵn các biến bên dưới để tham
						khảo hoặc chỉnh sửa lại theo ý bạn
					</p>
				</div>
				<Button
					onClick={handleDownloadExample}
					disabled={isDownloading}
				>
					<Download />
					{isDownloading ? 'Đang tải...' : 'Tải mẫu ví dụ'}
				</Button>
			</div>

			<div>
				<p className='mb-2 font-medium'>Các biến thông tin chung</p>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Biến</TableHead>
							<TableHead>Ý nghĩa</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{LETTERHEAD_VARIABLES.map(
							({ variable, description }) => (
								<TableRow key={variable}>
									<TableCell>
										<code className='rounded bg-muted px-1.5 py-0.5 text-sm'>
											{variable}
										</code>
									</TableCell>
									<TableCell>{description}</TableCell>
								</TableRow>
							)
						)}
					</TableBody>
				</Table>
			</div>

			<div>
				<p className='mb-2 font-medium'>Bảng dữ liệu</p>
				<p className='mb-2 text-sm text-muted-foreground'>
					Dữ liệu bảng được chèn bằng vòng lặp <code>columns</code>{' '}
					(tiêu đề cột) và <code>rows</code> (từng dòng dữ liệu). Tên
					cột do hệ thống tự tạo dựa trên loại dữ liệu bạn xuất, ví dụ
					với vũ khí/trang bị: "Số sê-ri", "Loại khí tài", "Tình
					trạng"...
				</p>
				<pre className='overflow-auto rounded-md bg-muted p-3 text-sm'>
					{`{FOR column IN columns}{INS $column}{END-FOR column}

{FOR row IN rows}
  {FOR column IN columns}{INS $row[$column]}{END-FOR column}
{END-FOR row}`}
				</pre>
			</div>

			{resourceType === 'students' && (
				<div>
					<p className='mb-2 font-medium'>
						Dữ liệu chi tiết (cho bảng phức tạp)
					</p>
					<p className='mb-2 text-sm text-muted-foreground'>
						Nếu bảng <code>rows</code>/<code>columns</code> ở trên
						không đủ (ví dụ cần gộp nhiều thông tin vào một ô, hoặc
						liệt kê danh sách con/em có số lượng thay đổi theo từng
						quân nhân), hãy dùng biến <code>troopers</code> — danh
						sách đầy đủ, chưa được rút gọn, của các quân nhân đã
						chọn. Xuống dòng trong một ô (<code>{'{-w:br/}'}</code>{' '}
						hoặc phím Enter trong Word) vẫn hoạt động bình thường,
						và bạn có thể lồng vòng lặp cho các trường dạng danh
						sách như <code>childrenInfos</code> hoặc{' '}
						<code>siblings</code>:
					</p>
					<pre className='overflow-auto rounded-md bg-muted p-3 text-sm'>
						{`{FOR t IN troopers}
  {INS t.fullName}
  {INS t.dob}
  {FOR c IN t.childrenInfos}{INS c.fullName} ({INS c.dob}){END-FOR c}
{END-FOR t}`}
					</pre>
					<p className='mt-2 mb-1 text-sm font-medium'>
						Các trường có sẵn trên mỗi quân nhân
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Trường</TableHead>
								<TableHead>Ý nghĩa</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{TROOPER_RAW_FIELDS.map(
								({ field, description }) => (
									<TableRow key={field}>
										<TableCell>
											<code className='rounded bg-muted px-1.5 py-0.5 text-sm'>
												{field}
											</code>
										</TableCell>
										<TableCell>{description}</TableCell>
									</TableRow>
								)
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
