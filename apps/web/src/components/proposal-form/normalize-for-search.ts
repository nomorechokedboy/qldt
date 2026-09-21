// Diacritic- and case-insensitive match so searching "nguyen" finds "Nguyễn"
// - typing tone marks on every search is a real friction point for
// Vietnamese names, and the trooper list is exactly where a long roster
// makes that friction worst.
export default function normalizeForSearch(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/đ/g, 'd')
}
