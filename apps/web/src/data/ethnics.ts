const ethnicsData = [
	{ id: '2', name: 'Kinh' },
	{ id: '3', name: 'T\u00e0y' },
	{ id: '4', name: 'Th\u00e1i' },
	{ id: '5', name: 'M\u01b0\u1eddng' },
	{ id: '6', name: 'Hoa' },
	{ id: '7', name: 'Kh\u01a1-me' },
	{ id: '8', name: 'N\u00f9ng' },
	{ id: '9', name: 'H\u2019m\u00f4ng' },
	{ id: '10', name: 'Dao' },
	{ id: '11', name: 'Gia-rai' },
	{ id: '12', name: '\u00ca-\u0111\u00ea' },
	{ id: '13', name: 'Ba-na' },
	{ id: '14', name: 'S\u00e1n Chay' },
	{ id: '15', name: 'Ch\u0103m' },
	{ id: '16', name: 'X\u01a1-\u0111\u0103ng' },
	{ id: '17', name: 'S\u00e1n D\u00ecu' },
	{ id: '18', name: 'Hr\u00ea' },
	{ id: '19', name: 'C\u01a1-ho' },
	{ id: '20', name: 'Ra-glai' },
	{ id: '21', name: 'Mn\u00f4ng' },
	{ id: '22', name: 'Th\u1ed5' },
	{ id: '23', name: 'Xti\u00eang' },
	{ id: '24', name: 'Kh\u01a1m\u00fa' },
	{ id: '25', name: 'Bru-V\u00e2n Ki\u1ec1u' },
	{ id: '26', name: 'Gi\u00e1y' },
	{ id: '27', name: 'C\u01a1-tu' },
	{ id: '28', name: 'Gi\u00e9-Tri\u00eang' },
	{ id: '29', name: 'Ta-\u00f4i' },
	{ id: '30', name: 'M\u1ea1' },
	{ id: '31', name: 'Co' },
	{ id: '32', name: 'Ch\u01a1-ro' },
	{ id: '33', name: 'H\u00e0 Nh\u00ec' },
	{ id: '34', name: 'Xinh Mun' },
	{ id: '35', name: 'Chu-ru' },
	{ id: '36', name: 'L\u00e0o' },
	{ id: '37', name: 'La-ch\u00ed' },
	{ id: '38', name: 'Ph\u00f9 L\u00e1' },
	{ id: '39', name: 'La H\u1ee7' },
	{ id: '40', name: 'Kh\u00e1ng' },
	{ id: '41', name: 'L\u1ef1' },
	{ id: '42', name: 'P\u00e0 Th\u1ebbn' },
	{ id: '43', name: 'L\u00f4L\u00f4' },
	{ id: '44', name: 'Ch\u1ee9t' },
	{ id: '45', name: 'M\u1ea3ng' },
	{ id: '46', name: 'C\u1edd lao' },
	{ id: '47', name: 'B\u1ed1 Y' },
	{ id: '48', name: 'La Ha' },
	{ id: '49', name: 'C\u1ed1ng' },
	{ id: '50', name: 'Ng\u00e1i' },
	{ id: '51', name: 'Si La' },
	{ id: '52', name: 'Pu P\u00e9o' },
	{ id: '53', name: 'Br\u00e2u' },
	{ id: '54', name: 'R\u01a1-m\u0103m' },
	{ id: '55', name: '\u01a0-\u0111u' },
	{ id: '56', name: 'H\u00e1n' }
]

export const EhtnicOptions = ethnicsData
	.filter(({ name }) => name !== '-')
	.map(({ name }) => {
		return {
			label: name,
			value: name
		}
	})

export const religionOptions = [
	{
		label: 'Không',
		value: 'Không'
	},
	{
		label: 'Phật giáo',
		value: 'Phật giáo'
	},
	{
		label: 'Thiên chúa giáo',
		value: 'Thiên chúa giáo'
	},
	{
		label: 'Công giáo',
		value: 'Công giáo'
	},
	{
		label: 'Tin Lành ',
		value: 'Tin Lành '
	},
	{
		label: 'Hòa Hảo ',
		value: 'Hòa Hảo '
	},
	{
		label: 'Cao Đài ',
		value: 'Cao Đài '
	}
]

export const eduLevelOptions = [
	{ label: '7/12', value: '7/12' },
	{ label: '8/12', value: '8/12' },
	{ label: '9/12', value: '9/12' },
	{ label: '10/12', value: '10/12' },
	{ label: '11/12', value: '11/12' },
	{ label: '12/12', value: '12/12' },
	{ label: 'Cao đẳng', value: 'Cao đẳng' },
	{ label: 'Đại học', value: 'Đại học' },
	{ label: 'Trung cấp', value: 'Trung cấp' },
	{ label: 'Sau đại học', value: 'Sau đại học' }
]

export const politicalOptions = [
	{ label: 'Đoàn viên', value: 'hcyu' },
	{ label: 'Đảng viên', value: 'cpv' }
]

export const rankOptions = [
	{ label: 'Binh nhất', value: 'Binh nhất' },
	{ label: 'Binh nhì', value: 'Binh nhì' },
	{ label: 'Hạ sĩ', value: 'Hạ sĩ' },
	{ label: 'Trung sĩ', value: 'Trung sĩ' },
	{ label: 'Thượng sĩ', value: 'Thượng sĩ' },
	{ label: 'Thiếu úy CN', value: 'Thiếu úy chuyên nghiệp' },
	{ label: 'Trung úy CN', value: 'Trung úy chuyên nghiệp' },
	{ label: 'Thượng úy CN', value: 'Thượng úy chuyên nghiệp' },
	{ label: 'Đại úy CN', value: 'Đại úy chuyên nghiệp' },
	{ label: 'Thiếu tá CN', value: 'Thiếu tá chuyên nghiệp' },
	{ label: 'Trung tá CN', value: 'Trung tá chuyên nghiệp' },
	{ label: 'Thượng tá CN', value: 'Thượng tá chuyên nghiệp' }
]

// User rank options (for officers)
export const userRankOptions = [
	{ label: 'Thiếu Úy', value: 'Thiếu Úy' },
	{ label: 'Trung Úy', value: 'Trung Úy' },
	{ label: 'Thượng Úy', value: 'Thượng Úy' },
	{ label: 'Đại Úy', value: 'Đại Úy' },
	{ label: 'Thiếu Tá', value: 'Thiếu Tá' },
	{ label: 'Trung Tá', value: 'Trung Tá' },
	{ label: 'Đại Tá', value: 'Đại Tá' }
]

// User position options
export const userPositionOptions = [
	{ label: 'Trung đội trưởng', value: 'Trung đội trưởng' },
	{ label: 'Đại đội trưởng', value: 'Đại đội trưởng' },
	{ label: 'Phó đại đội trưởng', value: 'Phó đại đội trưởng' },
	{ label: 'Chính trị viên Đại đội', value: 'Chính trị viên Đại đội' },
	{ label: 'Tiểu đoàn trưởng', value: 'Tiểu đoàn trưởng' },
	{ label: 'Phó tiểu đoàn trưởng', value: 'Phó tiểu đoàn trưởng' },
	{ label: 'Chính trị viên tiểu đoàn', value: 'Chính trị viên tiểu đoàn' },
	{
		label: 'Chính trị viên phó tiểu đoàn',
		value: 'Chính trị viên phó tiểu đoàn'
	},
	{ label: 'Phó chính ủy lữ đoàn', value: 'Phó chính ủy lữ đoàn' },
	{ label: 'Chính ủy lữ đoàn', value: 'Chính ủy lữ đoàn' },
	{ label: 'Phó lữ đoàn trưởng', value: 'Phó lữ đoàn trưởng' },
	{ label: 'Lữ đoàn trưởng', value: 'Lữ đoàn trưởng' },
	{ label: 'Phó chính ủy trung đoàn', value: 'Phó chính ủy trung đoàn' },
	{ label: 'Chính ủy trung đoàn', value: 'Chính ủy trung đoàn' },
	{ label: 'Phó trung đoàn trưởng', value: 'Phó trung đoàn trưởng' },
	{ label: 'Trung đoàn trưởng', value: 'Trung đoàn trưởng' },
	{ label: 'Phó chính ủy sư đoàn', value: 'Phó chính ủy sư đoàn' },
	{ label: 'Chính ủy sư đoàn', value: 'Chính ủy sư đoàn' },
	{ label: 'Phó sư đoàn trưởng', value: 'Phó sư đoàn trưởng' },
	{ label: 'Sư đoàn trưởng', value: 'Sư đoàn trưởng' }
]

export const soldierPositionOptions = [
	{ label: 'Y tá', value: 'Y tá' },
	{ label: 'Vệ binh', value: 'Vệ binh' },
	{ label: 'Tiểu đội trưởng vệ binh', value: 'Tiểu đội trưởng vệ binh' },
	{ label: 'Tiểu đội trưởng', value: 'Tiểu đội trưởng' },
	{ label: 'Tiểu đội trưởng VTĐ', value: 'Tiểu đội trưởng VTĐ' },
	{ label: 'Tiểu đội trưởng HTĐ', value: 'Tiểu đội trưởng HTĐ' },
	{ label: 'Tiểu đội trưởng TS', value: 'Tiểu đội trưởng TS' },
	{ label: 'Khẩu đội trưởng', value: 'Khẩu đội trưởng' },
	{
		label: 'Trung đội trưởng (thực tập)',
		value: 'Trung đội trưởng (thực tập)'
	},
	...userPositionOptions
]
