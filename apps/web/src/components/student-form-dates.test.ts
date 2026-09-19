import { describe, expect, it } from 'vitest'
import { withIsoDates } from './student-form-dates'

describe('withIsoDates', () => {
	it('converts every date field to ISO', () => {
		expect(
			withIsoDates({
				dob: '02/01/1999',
				fatherDob: '31/12/1970',
				motherDob: '01/02/1972',
				spouseDob: '03/04/2000',
				politicalOrgOfficialDate: '26/03/2015',
				cpvOfficialAt: '19/05/2020'
			})
		).toEqual({
			dob: '1999-01-02',
			fatherDob: '1970-12-31',
			motherDob: '1972-02-01',
			spouseDob: '2000-04-03',
			politicalOrgOfficialDate: '2015-03-26',
			cpvOfficialAt: '2020-05-19'
		})
	})

	it('leaves blank optional dates empty and a blank party date null', () => {
		const out = withIsoDates({
			dob: '02/01/1999',
			fatherDob: '',
			politicalOrgOfficialDate: '',
			cpvOfficialAt: ''
		})

		expect(out.fatherDob).toBe('')
		expect(out.motherDob).toBe('')
		expect(out.politicalOrgOfficialDate).toBe('')
		expect(out.cpvOfficialAt).toBeNull()
	})

	it('keeps other fields untouched', () => {
		expect(
			withIsoDates({ dob: '02/01/1999', fullName: 'A' }).fullName
		).toBe('A')
	})
})
