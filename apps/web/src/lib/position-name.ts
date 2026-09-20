import type { Student } from '@/types'

// `student.position` mirrors the position's short code (alias); the readable
// name lives on the joined position. Falls back to the code for records whose
// position row is missing.
export function positionName(
	student: Pick<Student, 'position' | 'positionRef'>
): string | undefined {
	return student.positionRef?.name || student.position
}
