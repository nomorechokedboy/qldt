import { useAppForm } from '@/hooks/demo.form'
import {
	Dialog,
	DialogHeader,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CreateClass } from '@/api'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Class, ClassBody } from '@/types'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'

const schema = z.object({
	name: z.string().min(1, 'Tên tiểu đội không được bỏ trống'),
	description: z.string(),
	unitId: z.string().min(1, 'Vui lòng chọn trung đội')
})

export interface ClassFormProps {
	onSuccess: (
		data: Class[],
		variables: ClassBody,
		context: unknown
	) => unknown
	platoonOptions: { id: number; name: string }[]
}

export default function ClassForm({
	onSuccess,
	platoonOptions
}: ClassFormProps) {
	const { mutateAsync } = useMutation({
		mutationFn: CreateClass,
		onError: (error) => {
			console.error('Failed to create class:', error)
		}
	})
	const [open, setOpen] = useState(false)
	const form = useAppForm({
		defaultValues: {
			name: '',
			description: '',
			unitId: ''
		},
		onSubmit: async ({ value, formApi }: { value: any; formApi: any }) => {
			const payload = { ...value, unitId: Number(value.unitId) }

			try {
				const result = await mutateAsync(payload)
				onSuccess(result, payload, undefined)

				toast.success('Thêm mới tiểu đội thành công')
				formApi.reset()
			} catch (err) {
				console.error(err)
				toast.error(getErrorMessage(err, 'Thêm mới tiểu đội thất bại'))
			} finally {
				setOpen(false)
			}
		},
		validators: {
			onBlur: schema
		}
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className='w-4 h-4 mr-2' />
					Thêm tiểu đội
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm tiểu đội</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<form
						className='space-y-4'
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
					>
						<div className='space-y-2'>
							<form.AppField name='name'>
								{(field: any) => (
									<field.TextField label='Tên tiểu đội' />
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='description'>
								{(field: any) => (
									<field.TextArea label='Mô tả về tiểu đội' />
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='unitId'>
								{(field: any) => (
									<field.Select
										label='Trung đội'
										placeholder='Chọn trung đội'
										values={platoonOptions.map((p) => ({
											label: p.name,
											value: String(p.id)
										}))}
									/>
								)}
							</form.AppField>
						</div>

						<DialogFooter>
							<DialogClose asChild>
								<Button variant='outline'>Hủy</Button>
							</DialogClose>

							<form.AppForm>
								<form.SubscribeButton label='Thêm' />
							</form.AppForm>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	)
}
