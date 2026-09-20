const stats = {
	politicalOrg: {
		cpv: 'Đảng',
		hcyu: 'Đoàn'
	},
	charts: {
		byUnit: 'Biểu đồ trình độ quân nhân theo đơn vị & lớp',
		total: 'Tổng số',
		count: 'Số lượng',
		ethnic: 'Phân bố dân tộc',
		religion: 'Phân bố tôn giáo',
		education: 'Phân bố trình độ văn hóa',
		politicalOrg: 'Phân bố Đoàn/Đảng'
	},
	report: {
		totalPersonnelValue: 'Tổng quân số: {{count}}',
		totalPersonnel: 'Tổng quân số',
		wholeUnit: 'Toàn đơn vị',
		unitCount: 'Số đơn vị',
		units: 'Đơn vị',
		classCount: 'Số lớp',
		squads: 'Tiểu đội',
		tabs: {
			overview: 'Tổng quan',
			detailed: 'Chi tiết',
			charts: 'Biểu đồ'
		},
		overviewTitle: 'Thống kê tổng quan theo đơn vị',
		exportTitle: 'Xuất báo cáo',
		exportPdf: 'Xuất PDF',
		exportExcel: 'Xuất file Excel (.xlsx)',
		exportFailed: 'Chưa thể xuất file, đã có lỗi xảy ra!',
		inDevelopment: 'Tính năng đang phát triển'
	},
	table: {
		title: 'Bảng thống kê chi tiết',
		unit: 'Đơn vị',
		rankGroup: 'Phân cấp',
		ethnic: 'Dân tộc',
		religion: 'Tôn giáo',
		education: 'Văn hóa',
		partyMember: 'Đảng viên',
		youthMember: 'Đoàn viên',
		family: 'Gia đình',
		note: 'Ghi chú',
		fieldOfficer: 'Tá',
		juniorOfficer: 'Úy',
		proSoldierCommander: 'QNCN (Cán bộ quản lý)',
		proSoldier: 'QNCN',
		revolution: 'Cách mạng',
		military: 'N/quân-quyền',
		abroad: 'Nước ngoài',
		total: 'Tổng số'
	},
	exportDialog: {
		title: 'Xuất dữ liệu',
		description: 'Hãy điền những thông tin cần thiết để xuất dữ liệu',
		titleLabel: 'Tiêu đề của file thống kê',
		titleRequired: 'Tiêu đề của file thống kê không được bỏ trống',
		filenameLabel: 'Tên file',
		filenameRequired: 'Tên file không được bỏ trống',
		cancel: 'Hủy',
		confirm: 'Xác nhận',
		exporting: 'Đang xuất file...'
	},
	period: {
		month: 'Tháng {{month}}',
		quarter: 'Quý {{quarter}}',
		unit: 'Đơn vị'
	},
	birthday: {
		heading: 'Danh sách quân nhân có sinh nhật trong',
		headingWeek: 'Danh sách quân nhân có sinh nhật trong tuần',
		descriptionMonth:
			'Đây là danh sách quân nhân có sinh nhật trong tháng {{month}} của đại đội',
		descriptionQuarter:
			'Đây là danh sách quân nhân có sinh nhật trong quý {{quarter}} của đại đội',
		descriptionWeek:
			'Đây là danh sách quân nhân có sinh nhật trong tuần của đại đội',
		tabs: {
			week: 'Tuần',
			month: 'Tháng',
			quarter: 'Quý'
		}
	},
	cpv: {
		heading: 'Danh sách quân nhân chuẩn bị chuyển Đảng chính thức trong',
		headingWeek:
			'Danh sách quân nhân chuẩn bị chuyển Đảng chính thức trong tuần',
		descriptionMonth:
			'Đây là danh sách quân nhân chuẩn bị chuyển Đảng chính thức trong tháng {{month}} của đại đội',
		descriptionQuarter:
			'Đây là danh sách quân nhân chuẩn bị chuyển Đảng chính thức trong quý {{quarter}} của đại đội',
		descriptionWeek:
			'Đây là danh sách quân nhân chuẩn bị chuyển Đảng chính thức trong tuần của đại đội'
	},
	datePicker: {
		placeholder: 'Ngày/tháng/năm',
		formatHint: 'Hãy nhập {{label}} theo định dạng dd/mm/yyyy',
		invalid: 'Vui lòng nhập một ngày hợp lệ'
	},
	dateRange: {
		placeholder: 'Chọn khoảng ngày',
		clear: 'Xoá khoảng ngày'
	},
	routes: {
		cpvTitle: 'Danh sách quân nhân là đảng viên',
		hcyuTitle: 'Danh sách quân nhân là đoàn viên',
		religionTitle: 'Danh sách quân nhân có tôn giáo',
		hardshipTitle: 'Danh sách quân nhân có hoàn cảnh khó khăn',
		ethnicMinorityTitle: 'Danh sách quân nhân dân tộc thiểu số',
		pickHint: 'Chọn tiểu đoàn, đại đội, lớp để xem bảng học viên',
		battalion: 'Tiểu đoàn',
		company: 'Đại đội',
		class: 'Lớp',
		squad: 'Tiểu đội',
		choose: '--Chọn {{label}}--',
		chooseBattalion: '--Chọn tiểu đoàn--',
		chooseCompany: '--Chọn đại đội--',
		chooseClass: '--Chọn lớp--',
		filter: 'Lọc'
	}
} as const

export default stats
