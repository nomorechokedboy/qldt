import { AvatarUpload, type AvatarUploadProps } from '../avatar-upload'
import { FieldFrame } from './field-frame'
import { useFileField } from './use-file-field'

export type AvatarField = Omit<
	AvatarUploadProps,
	'onChange' | 'onBlur' | 'enableUpload'
> & {
	maxSize?: number
	label?: string
}

export function AvatarField({
	label,
	maxSize = 2 * 1024 * 1024,
	...props
}: AvatarField) {
	const { field, handleInputChange } = useFileField(maxSize)

	return (
		<FieldFrame label={label} htmlFor={label} className='space-y-4'>
			<AvatarUpload
				{...props}
				onChange={handleInputChange}
				onBlur={field.handleBlur}
				id={label}
				enableUpload
			/>
		</FieldFrame>
	)
}
