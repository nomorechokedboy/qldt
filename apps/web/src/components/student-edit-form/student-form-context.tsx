import { createContext, useContext } from 'react'

// The form is the tanstack form produced by useAppForm; like the other
// student form pieces it is passed around untyped.
export type StudentFormApi = any

const StudentFormContext = createContext<StudentFormApi>(null)

export const StudentFormProvider = StudentFormContext.Provider

export function useStudentForm(): StudentFormApi {
	const form = useContext(StudentFormContext)
	if (!form) throw new Error('useStudentForm needs a StudentFormProvider')
	return form
}
