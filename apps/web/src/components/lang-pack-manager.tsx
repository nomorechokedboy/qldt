import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { useLangPackMutations, useLangPacks } from '@/hooks/useLangPacks'
import { LANGUAGES, type LanguageCode } from '@/i18n'
import {
	analyzeLangPackFile,
	buildLangPackTemplate,
	LangPackFileError,
	type LangPackAnalysis
} from '@/i18n/lang-packs'
import { cn, getErrorMessage } from '@/lib/utils'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Language = (typeof LANGUAGES)[number]

function downloadJson(filename: string, content: string) {
	const url = URL.createObjectURL(
		new Blob([content], { type: 'application/json' })
	)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}

function readText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result))
		reader.onerror = () => reject(reader.error)
		reader.readAsText(file)
	})
}

function KeyList({ keys }: { keys: string[] }) {
	const shown = keys.slice(0, 20)
	return (
		<ul className='mt-1 max-h-32 space-y-0.5 overflow-auto rounded-md bg-muted px-3 py-2 font-mono text-xs'>
			{shown.map((key) => (
				<li key={key}>{key}</li>
			))}
			{keys.length > shown.length && (
				<li>… +{keys.length - shown.length}</li>
			)}
		</ul>
	)
}

function UploadResult({ result }: { result: LangPackAnalysis }) {
	const { t } = useTranslation('langPacks')
	return (
		<output className='block space-y-3 text-sm'>
			<p className='font-medium'>
				{t('result.applied', { count: result.applied })}
			</p>
			{result.placeholderMismatches.length > 0 && (
				<div>
					<p className='text-muted-foreground'>
						{t('result.placeholders', {
							count: result.placeholderMismatches.length
						})}
					</p>
					<KeyList keys={result.placeholderMismatches} />
				</div>
			)}
			{result.ignored.length > 0 && (
				<div>
					<p className='text-muted-foreground'>
						{t('result.ignored', { count: result.ignored.length })}
					</p>
					<KeyList keys={result.ignored} />
				</div>
			)}
		</output>
	)
}

function LanguagePackCard({
	language,
	isCustom,
	isLoading
}: {
	language: Language
	isCustom: boolean
	isLoading: boolean
}) {
	const { t } = useTranslation('langPacks')
	const { save, reset } = useLangPackMutations()
	const [result, setResult] = useState<LangPackAnalysis>()
	const [confirmingReset, setConfirmingReset] = useState(false)
	const [dragging, setDragging] = useState(false)

	const busy = save.isPending || reset.isPending

	async function handleFile(file: File) {
		setResult(undefined)
		try {
			const analysis = analyzeLangPackFile(
				file,
				await readText(file),
				language.code as LanguageCode
			)
			await save.mutateAsync({
				language: language.code,
				pack: analysis.pack
			})
			setResult(analysis)
			toast.success(t('toast.uploaded', { language: language.label }))
		} catch (err) {
			toast.error(
				err instanceof LangPackFileError
					? err.message
					: getErrorMessage(err, t('toast.uploadFailed'))
			)
		}
	}

	async function handleReset() {
		setConfirmingReset(false)
		setResult(undefined)
		try {
			await reset.mutateAsync(language.code)
			toast.success(t('toast.resetDone', { language: language.label }))
		} catch (err) {
			toast.error(getErrorMessage(err, t('toast.resetFailed')))
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-start justify-between gap-3'>
					<div className='space-y-1'>
						<CardTitle className='font-serif text-lg'>
							{language.label}
						</CardTitle>
						<CardDescription className='font-mono'>
							{language.code}
						</CardDescription>
					</div>
					<Badge variant={isCustom ? 'default' : 'outline'}>
						{isLoading
							? t('loading')
							: isCustom
								? t('status.custom')
								: t('status.default')}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				<label
					className={cn(
						'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
						'hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring',
						dragging && 'border-primary bg-accent/50',
						busy && 'pointer-events-none opacity-60'
					)}
					onDragOver={(e) => {
						e.preventDefault()
						setDragging(true)
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault()
						setDragging(false)
						const file = e.dataTransfer.files[0]
						if (file) void handleFile(file)
					}}
				>
					<Upload
						className='h-7 w-7 text-muted-foreground'
						aria-hidden
					/>
					<span className='text-sm'>
						{save.isPending ? t('uploading') : t('dropzone')}
					</span>
					<input
						type='file'
						accept='.json,application/json'
						className='sr-only'
						aria-label={`${language.label}: ${t('dropzone')}`}
						disabled={busy}
						onChange={(e) => {
							const file = e.target.files?.[0]
							e.target.value = ''
							if (file) void handleFile(file)
						}}
					/>
				</label>

				<p className='text-xs text-muted-foreground'>
					{t('formatHint')}
				</p>

				<div className='flex flex-wrap gap-2'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() =>
							downloadJson(
								`lang-pack-${language.code}-default.json`,
								buildLangPackTemplate(
									language.code as LanguageCode
								)
							)
						}
					>
						<Download />
						{t('downloadTemplate')}
					</Button>
					{isCustom && (
						<Button
							type='button'
							variant='outline'
							size='sm'
							disabled={busy}
							onClick={() => setConfirmingReset(true)}
						>
							<RotateCcw />
							{t('reset')}
						</Button>
					)}
				</div>

				{result && <UploadResult result={result} />}
			</CardContent>

			<Dialog open={confirmingReset} onOpenChange={setConfirmingReset}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('confirmReset.title')}</DialogTitle>
						<DialogDescription>
							{t('confirmReset.description', {
								language: language.label
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setConfirmingReset(false)}
						>
							{t('confirmReset.cancel')}
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={handleReset}
						>
							{t('confirmReset.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}

export default function LangPackManager() {
	const { t } = useTranslation('langPacks')
	const { data: packs, isLoading } = useLangPacks()

	return (
		<div className='space-y-6'>
			<p className='max-w-prose text-muted-foreground'>{t('subtitle')}</p>
			<div className='grid gap-6 lg:grid-cols-2'>
				{LANGUAGES.map((language) => (
					<LanguagePackCard
						key={language.code}
						language={language}
						isLoading={isLoading}
						isCustom={
							Object.keys(packs?.[language.code] ?? {}).length > 0
						}
					/>
				))}
			</div>
		</div>
	)
}
