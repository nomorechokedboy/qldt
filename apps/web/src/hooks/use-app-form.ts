import DatePicker from '@/components/date-picker'
import { createFormHook } from '@tanstack/react-form'
import {
	Combobox,
	EditableInput,
	Select,
	SubscribeButton,
	TextArea,
	TextField,
	UploadField,
	AvatarField
} from '@/components/FormComponents'
import { fieldContext, formContext } from './form-context'

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		Select,
		TextArea,
		DatePicker,
		Combobox,
		EditableInput,
		UploadField,
		AvatarField
	},
	formComponents: {
		SubscribeButton
	},
	fieldContext,
	formContext
})
