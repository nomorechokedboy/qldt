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
	{ label: 'Binh nhất', value: 'Binh nhất', group: 'HSQ-BS' },
	{ label: 'Binh nhì', value: 'Binh nhì', group: 'HSQ-BS' },
	{ label: 'Hạ sĩ', value: 'Hạ sĩ', group: 'HSQ-BS' },
	{ label: 'Trung sĩ', value: 'Trung sĩ', group: 'HSQ-BS' },
	{ label: 'Thượng sĩ', value: 'Thượng sĩ', group: 'HSQ-BS' },
	{ label: 'Thiếu úy', value: 'Thiếu úy', group: 'SQ' },
	{ label: 'Trung úy', value: 'Trung úy', group: 'SQ' },
	{ label: 'Thượng úy', value: 'Thượng úy', group: 'SQ' },
	{ label: 'Đại úy', value: 'Đại úy', group: 'SQ' },
	{ label: 'Thiếu tá', value: 'Thiếu tá', group: 'SQ' },
	{ label: 'Trung tá', value: 'Trung tá', group: 'SQ' },
	{ label: 'Thượng tá', value: 'Thượng tá', group: 'SQ' },
	{ label: 'Đại tá', value: 'Đại tá', group: 'SQ' },
	{ label: 'Thiếu úy CN', value: 'Thiếu úy chuyên nghiệp', group: 'QNCN' },
	{ label: 'Trung úy CN', value: 'Trung úy chuyên nghiệp', group: 'QNCN' },
	{ label: 'Thượng úy CN', value: 'Thượng úy chuyên nghiệp', group: 'QNCN' },
	{ label: 'Đại úy CN', value: 'Đại úy chuyên nghiệp', group: 'QNCN' },
	{ label: 'Thiếu tá CN', value: 'Thiếu tá chuyên nghiệp', group: 'QNCN' },
	{ label: 'Trung tá CN', value: 'Trung tá chuyên nghiệp', group: 'QNCN' },
	{ label: 'Thượng tá CN', value: 'Thượng tá chuyên nghiệp', group: 'QNCN' }
]

// User rank options (for officers)
export const userRankOptions = [
	{ label: 'Thiếu úy', value: 'Thiếu úy' },
	{ label: 'Trung úy', value: 'Trung úy' },
	{ label: 'Thượng úy', value: 'Thượng úy' },
	{ label: 'Đại úy', value: 'Đại úy' },
	{ label: 'Thiếu tá', value: 'Thiếu tá' },
	{ label: 'Trung tá', value: 'Trung tá' },
	{ label: 'Đại tá', value: 'Đại tá' }
]

// User position options
export const userPositionOptions = [
	{
		label: 'Trung đội trưởng',
		value: 'Trung đội trưởng',
		group: 'Trung đội'
	},
	{ label: 'Đại đội trưởng', value: 'Đại đội trưởng', group: 'Đại đội' },
	{
		label: 'Phó đại đội trưởng',
		value: 'Phó đại đội trưởng',
		group: 'Đại đội'
	},
	{
		label: 'Chính trị viên Đại đội',
		value: 'Chính trị viên Đại đội',
		group: 'Đại đội'
	},
	{
		label: 'Chính trị viên phó Đại đội',
		value: 'Chính trị viên phó Đại đội',
		group: 'Đại đội'
	},
	{ label: 'Tiểu đoàn trưởng', value: 'Tiểu đoàn trưởng', group: 'Đại đội' },
	{
		label: 'Phó tiểu đoàn trưởng',
		value: 'Phó tiểu đoàn trưởng',
		group: 'Tiểu đoàn'
	},
	{
		label: 'Chính trị viên tiểu đoàn',
		value: 'Chính trị viên tiểu đoàn',
		group: 'Tiểu đoàn'
	},
	{
		label: 'Chính trị viên phó tiểu đoàn',
		value: 'Chính trị viên phó tiểu đoàn',
		group: 'Tiểu đoàn'
	},
	{
		label: 'Phó chính ủy lữ đoàn',
		value: 'Phó chính ủy lữ đoàn',
		group: 'Lữ đoàn'
	},
	{ label: 'Chính ủy lữ đoàn', value: 'Chính ủy lữ đoàn', group: 'Lữ đoàn' },
	{
		label: 'Phó lữ đoàn trưởng',
		value: 'Phó lữ đoàn trưởng',
		group: 'Lữ đoàn'
	},
	{ label: 'Lữ đoàn trưởng', value: 'Lữ đoàn trưởng', group: 'Lữ đoàn' },
	{
		label: 'Phó chính ủy trung đoàn',
		value: 'Phó chính ủy trung đoàn',
		group: 'Trung đoàn'
	},
	{
		label: 'Chính ủy trung đoàn',
		value: 'Chính ủy trung đoàn',
		group: 'Trung đoàn'
	},
	{
		label: 'Phó trung đoàn trưởng',
		value: 'Phó trung đoàn trưởng',
		group: 'Trung đoàn'
	},
	{
		label: 'Trung đoàn trưởng',
		value: 'Trung đoàn trưởng',
		group: 'Trung đoàn'
	},
	{
		label: 'Phó chính ủy sư đoàn',
		value: 'Phó chính ủy sư đoàn',
		group: 'Sư đoàn'
	},
	{ label: 'Chính ủy sư đoàn', value: 'Chính ủy sư đoàn', group: 'Sư đoàn' },
	{
		label: 'Phó sư đoàn trưởng',
		value: 'Phó sư đoàn trưởng',
		group: 'Sư đoàn'
	},
	{ label: 'Sư đoàn trưởng', value: 'Sư đoàn trưởng', group: 'Sư đoàn' }
]

export const soldierPositionOptions = [
	{ label: 'CNCT', value: 'CNCT', group: 'Chủ nhiệm' },
	{ label: 'CN.HC-KT', value: 'CN.HC-KT', group: 'Chủ nhiệm' },

	{ label: 'Phó CNCT', value: 'Phó CNCT', group: 'Phó chủ nhiệm' },
	{ label: 'Phó CNUBKT', value: 'Phó CNUBKT', group: 'Phó chủ nhiệm' },
	{ label: 'P.CN. HC-KT', value: 'P.CN. HC-KT', group: 'Phó chủ nhiệm' },

	{ label: 'TLTS', value: 'TLTS', group: 'Trợ lý' },
	{ label: 'TLTT', value: 'TLTT', group: 'Trợ lý' },
	{ label: 'TLHC', value: 'TLHC', group: 'Trợ lý' },
	{ label: 'TL. Công Binh', value: 'TL. Công Binh', group: 'Trợ lý' },
	{ label: 'TL. KH-TH', value: 'TL. KH-TH', group: 'Trợ lý' },
	{ label: 'TL. HL', value: 'TL. HL', group: 'Trợ lý' },
	{ label: 'TL. TC', value: 'TL. TC', group: 'Trợ lý' },
	{ label: 'TL. QS-CS', value: 'TL. QS-CS', group: 'Trợ lý' },
	{ label: 'TL. TB-ĐV', value: 'TL. TB-ĐV', group: 'Trợ lý' },
	{ label: 'TLTTGD', value: 'TLTTGD', group: 'Trợ lý' },
	{ label: 'TLTĐKT', value: 'TLTĐKT', group: 'Trợ lý' },
	{ label: 'TLCB-CS', value: 'TLCB-CS', group: 'Trợ lý' },
	{ label: 'TLKTVT', value: 'TLKTVT', group: 'Trợ lý' },
	{ label: 'TL.XM', value: 'TL.XM', group: 'Trợ lý' },
	{ label: 'TL.QK', value: 'TL.QK', group: 'Trợ lý' },
	{ label: 'TL.QN', value: 'TL.QN', group: 'Trợ lý' },
	{ label: 'TL.XD', value: 'TL.XD', group: 'Trợ lý' },
	{ label: 'TL.DT', value: 'TL.DT', group: 'Trợ lý' },
	{ label: 'TL.TT', value: 'TL.TT', group: 'Trợ lý' },
	{ label: 'Trợ lý CT', value: 'Trợ lý CT', group: 'Trợ lý' },

	{ label: 'Y tá', value: 'Y tá', group: 'NVCM-KT' },
	{ label: 'Y sĩ', value: 'Y sĩ', group: 'NVCM-KT' },
	{ label: 'NV. Quân lực', value: 'NV. Quân lực', group: 'NVCM-KT' },
	{ label: 'NV. Cơ yếu', value: 'NV. Cơ yếu', group: 'NVCM-KT' },
	{ label: 'NV. VT-BM', value: 'NV. VT-BM', group: 'NVCM-KT' },
	{ label: 'NV. Đồ bản', value: 'NV. Đồ bản', group: 'NVCM-KT' },
	{ label: 'NV. VT', value: 'NV. VT', group: 'NVCM-KT' },
	{ label: 'NVCLB', value: 'NVCLB', group: 'NVCM-KT' },
	{ label: 'NV. Xăng dầu', value: 'NV. Xăng dầu', group: 'NVCM-KT' },
	{ label: 'NV thống kê', value: 'NV thống kê', group: 'NVCM-KT' },
	{ label: 'NV DT', value: 'NV DT', group: 'NVCM-KT' },
	{ label: 'NV QN', value: 'NV QN', group: 'NVCM-KT' },
	{ label: 'NV.TQ', value: 'NV.TQ', group: 'NVCM-KT' },
	{ label: 'NV. Quản lý', value: 'NV. Quản lý', group: 'NVCM-KT' },
	{ label: 'NV. Nấu ăn', value: 'NV. Nấu ăn', group: 'NVCM-KT' },
	{ label: 'NVXM-XD', value: 'NVXM-XD', group: 'NVCM-KT' },
	{ label: 'NVQK', value: 'NVQK', group: 'NVCM-KT' },
	{ label: 'NVNA', value: 'NVNA', group: 'NVCM-KT' },
	{ label: 'NVQL-QK', value: 'NVQL-QK', group: 'NVCM-KT' },
	{ label: 'NV.XM', value: 'NV.XM', group: 'NVCM-KT' },
	{ label: 'NVBV', value: 'NVBV', group: 'NVCM-KT' },
	{ label: 'NV.XD', value: 'NV.XD', group: 'NVCM-KT' },
	{ label: 'Lái xe', value: 'Lái xe', group: 'NVCM-KT' },
	{ label: 'BQV', value: 'BQV', group: 'NVCM-KT' },
	{ label: 'QKV', value: 'QKV', group: 'NVCM-KT' },

	{ label: 'Kđt', value: 'Kđt', group: 'HSQ CH' },
	{ label: 'KĐT', value: 'KĐT', group: 'HSQ CH' },
	{ label: 'at BB', value: 'at BB', group: 'HSQ CH' },
	{ label: 'at TS-KT', value: 'at TS-KT', group: 'HSQ CH' },
	{ label: 'at TS', value: 'at TS', group: 'HSQ CH' },
	{ label: 'at VTĐ', value: 'at VTĐ', group: 'HSQ CH' },
	{ label: 'at TT', value: 'at TT', group: 'HSQ CH' },
	{ label: 'at KT', value: 'at KT', group: 'HSQ CH' },
	{ label: 'at ĐĐ', value: 'at ĐĐ', group: 'HSQ CH' },
	{ label: 'at HTĐ', value: 'at HTĐ', group: 'HSQ CH' },

	{ label: 'TSV', value: 'TSV', group: 'CS' },
	{ label: 'KTV', value: 'KTV', group: 'CS' },
	{ label: 'HTĐ', value: 'HTĐ', group: 'CS' },
	{ label: 'PT', value: 'PT', group: 'CS' },
	{ label: 'VTĐ', value: 'VTĐ', group: 'CS' },
	{ label: 'CS', value: 'CS', group: 'CS' },
	{ label: 'NQ', value: 'NQ', group: 'CS' },

	{
		label: 'Trạm trưởng trạm sửa chữa',
		value: 'Trạm trưởng trạm sửa chữa',
		group: 'Trạm sửa chữa'
	},

	{ label: 'Thợ cơ khí', value: 'Thợ cơ khí', group: 'Thợ' },
	{ label: 'Thợ xe', value: 'Thợ xe', group: 'Thợ' },
	{ label: 'Thợ KTQH', value: 'Thợ KTQH', group: 'Thợ' },
	{ label: 'Thợ đạn', value: 'Thợ đạn', group: 'Thợ' },
	{ label: 'Thợ pháo', value: 'Thợ pháo', group: 'Thợ' },
	{ label: 'Thợ VKBB', value: 'Thợ VKBB', group: 'Thợ' },
	{ label: 'Thợ xe/XD', value: 'Thợ xe/XD', group: 'Thợ' },

	{
		label: 'Tổ trưởng kho VK-Đ',
		value: 'Tổ trưởng kho VK-Đ',
		group: 'Kho VK-Đ'
	},

	{ label: 'BXT', value: 'BXT' },
	{ label: "bt'VT", value: "bt'VT" },
	{ label: 'QKV/d', value: 'QKV/d' },
	{ label: 'Đ.tr', value: 'Đ.tr' },
	{ label: 'Phó TMT', value: 'Phó TMT' },
	{ label: 'Phó LĐT-TMT', value: 'Phó LĐT-TMT' },

	{
		label: 'Trung đội trưởng (thực tập)',
		value: 'Trung đội trưởng (thực tập)',
		group: 'Trung đội'
	},
	...userPositionOptions
]
