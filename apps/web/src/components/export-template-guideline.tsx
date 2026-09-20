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
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'

// `field` is the exact variable name used in a docx template, so it is never
// translated; only its description (looked up by `key`) is.
const TROOPER_RAW_FIELDS = [
	{ field: 'fullName', key: 'fullName' },
	{ field: 'dob', key: 'dob' },
	{ field: 'rank', key: 'rank' },
	{ field: 'position', key: 'position' },
	{ field: 'previousUnit', key: 'previousUnit' },
	{ field: 'previousPosition', key: 'previousPosition' },
	{ field: 'birthPlace', key: 'birthPlace' },
	{ field: 'address', key: 'address' },
	{ field: 'enlistmentPeriod', key: 'enlistmentPeriod' },
	{ field: 'ethnic', key: 'ethnic' },
	{ field: 'religion', key: 'religion' },
	{ field: 'educationLevel', key: 'educationLevel' },
	{ field: 'schoolName', key: 'schoolName' },
	{ field: 'major', key: 'major' },
	{ field: 'isGraduated', key: 'isGraduated' },
	{ field: 'phone', key: 'phone' },
	{ field: 'policyBeneficiaryGroup', key: 'policyBeneficiaryGroup' },
	{ field: 'politicalOrg', key: 'politicalOrg' },
	{ field: 'politicalOrgOfficialDate', key: 'politicalOrgOfficialDate' },
	{ field: 'cpvId', key: 'cpvId' },
	{ field: 'cpvOfficialAt', key: 'cpvOfficialAt' },
	{ field: 'shortcoming', key: 'shortcoming' },
	{ field: 'talent', key: 'talent' },
	{ field: 'fatherName', key: 'fatherName' },
	{ field: 'fatherJob', key: 'fatherJob' },
	{ field: 'fatherPhoneNumber', key: 'fatherPhoneNumber' },
	{ field: 'motherName', key: 'motherName' },
	{ field: 'motherJob', key: 'motherJob' },
	{ field: 'motherPhoneNumber', key: 'motherPhoneNumber' },
	{ field: 'isMarried', key: 'isMarried' },
	{ field: 'spouseName', key: 'spouseName' },
	{ field: 'spouseJob', key: 'spouseJob' },
	{ field: 'spousePhoneNumber', key: 'spousePhoneNumber' },
	{ field: 'familySize', key: 'familySize' },
	{ field: 'familyBackground', key: 'familyBackground' },
	{ field: 'achievement', key: 'achievement' },
	{ field: 'disciplinaryHistory', key: 'disciplinaryHistory' },
	{ field: 'studentId', key: 'studentId' },
	{ field: 'status', key: 'status' },
	{ field: 'unit.name', key: 'unitName' },
	{ field: 'childrenInfos', key: 'childrenInfos' },
	{ field: 'siblings', key: 'siblings' },
	{ field: 'contactPerson', key: 'contactPerson' }
] as const

const LETTERHEAD_VARIABLES = [
	'unitName',
	'underUnitName',
	'city',
	'day',
	'month',
	'year',
	'reportTitle',
	'commanderPosition',
	'commanderRank',
	'commanderName'
] as const

export interface ExportTemplateGuidelineProps {
	resourceType: ExportResourceType
}

export function ExportTemplateGuideline({
	resourceType
}: ExportTemplateGuidelineProps) {
	const { t } = useTranslation('io')
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
			toast.error(t('guideline.example.failed'))
		} finally {
			setIsDownloading(false)
		}
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center justify-between rounded-md border p-4'>
				<div>
					<p className='font-medium'>
						{t('guideline.example.title')}
					</p>
					<p className='text-sm text-muted-foreground'>
						{t('guideline.example.description')}
					</p>
				</div>
				<Button
					onClick={handleDownloadExample}
					disabled={isDownloading}
				>
					<Download />
					{isDownloading
						? t('guideline.example.downloading')
						: t('guideline.example.download')}
				</Button>
			</div>

			<div>
				<p className='mb-2 font-medium'>
					{t('guideline.general.title')}
				</p>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t('guideline.general.variable')}
							</TableHead>
							<TableHead>
								{t('guideline.general.meaning')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{LETTERHEAD_VARIABLES.map((name) => (
							<TableRow key={name}>
								<TableCell>
									<code className='rounded bg-muted px-1.5 py-0.5 text-sm'>
										{`{${name}}`}
									</code>
								</TableCell>
								<TableCell>
									{t(`guideline.letterhead.${name}`)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div>
				<p className='mb-2 font-medium'>{t('guideline.table.title')}</p>
				<p className='mb-2 text-sm text-muted-foreground'>
					<Trans
						t={t}
						i18nKey='guideline.table.body'
						components={{ code: <code /> }}
					/>
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
						{t('guideline.detail.title')}
					</p>
					<p className='mb-2 text-sm text-muted-foreground'>
						<Trans
							t={t}
							i18nKey='guideline.detail.body'
							values={{ lineBreak: '{-w:br/}' }}
							components={{ code: <code /> }}
						/>
					</p>
					<pre className='overflow-auto rounded-md bg-muted p-3 text-sm'>
						{`{FOR t IN troopers}
  {INS t.fullName}
  {INS t.dob}
  {FOR c IN t.childrenInfos}{INS c.fullName} ({INS c.dob}){END-FOR c}
{END-FOR t}`}
					</pre>
					<p className='mt-2 mb-1 text-sm font-medium'>
						{t('guideline.detail.fieldsTitle')}
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t('guideline.detail.field')}
								</TableHead>
								<TableHead>
									{t('guideline.general.meaning')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{TROOPER_RAW_FIELDS.map(({ field, key }) => (
								<TableRow key={field}>
									<TableCell>
										<code className='rounded bg-muted px-1.5 py-0.5 text-sm'>
											{field}
										</code>
									</TableCell>
									<TableCell>
										{t(`guideline.trooper.${key}`)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
