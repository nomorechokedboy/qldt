import dayjs from 'dayjs'

// Proposal dates travel as "YYYY-MM-DD"; people read them as dd/mm/yyyy.
export default function formatProposalDate(value: string): string {
	return dayjs(value, 'YYYY-MM-DD').format('DD/MM/YYYY')
}
