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
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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

export function ExportTemplateGuideline() {
	const [isDownloading, setIsDownloading] = useState(false)

	async function handleDownloadExample() {
		setIsDownloading(true)
		try {
			const resp = await DownloadExampleExportTemplate()
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
		</div>
	)
}
