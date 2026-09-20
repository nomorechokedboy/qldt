const table = {
	columns: {
		unit: 'Đơn vị',
		fullName: 'Họ và tên',
		yearOfBirth: 'Năm sinh',
		dob: 'Ngày sinh',
		birthPlace: 'Quê quán',
		address: 'Trú quán',
		enlistmentPeriod: 'Thời gian nhập ngũ',
		graduated: 'Đã tốt nghiệp',
		major: 'Chuyên ngành',
		phone: 'Số điện thoại',
		policyGroup: 'Đối tượng chính sách',
		politicalOrg: 'Đoàn/Đảng',
		hcyuDate: 'Ngày vào Đoàn',
		cpvId: 'Số thẻ Đảng',
		cpvDate: 'Ngày vào Đảng',
		previousPosition: 'Chức vụ cũ',
		religion: 'Tôn giáo',
		schoolName: 'Tên trường',
		shortcoming: 'Khuyết điểm',
		talent: 'Tài năng',
		rank: 'Cấp bậc',
		position: 'Chức vụ',
		previousUnit: 'Đơn vị cũ',
		ethnic: 'Dân tộc',
		education: 'Học vấn',
		educationLevel: 'Trình độ học vấn',
		fatherName: 'Họ tên bố',
		fatherJob: 'Nghề nghiệp của bố',
		fatherPhone: 'SĐT bố',
		motherName: 'Họ tên mẹ',
		motherJob: 'Nghề nghiệp của mẹ',
		motherPhone: 'SĐT mẹ',
		status: 'Trạng thái',
		activityStatus: 'Tình trạng',
		familyCircumstances: 'Hoàn cảnh gia đình',
		married: 'Đã kết hôn',
		spouseName: 'Họ tên vợ/chồng',
		spouseJob: 'Nghề nghiệp vợ/chồng',
		spousePhone: 'SĐT vợ/chồng',
		familySize: 'Số nhân khẩu',
		familyBackground: 'Thành phần gia đình',
		achievement: 'Thành tích',
		discipline: 'Kỷ luật',
		children: 'Con cái',
		studentId: 'Mã học viên'
	},
	values: {
		yes: 'Có',
		no: 'Không',
		cpvMember: 'Đảng viên',
		hcyuMember: 'Đoàn viên',
		confirmed: 'Đã xác nhận',
		pending: 'Chưa xác nhận'
	},
	emptyTable: 'Không có dữ liệu nào',
	toolbar: {
		reset: 'Đặt lại'
	},
	viewOptions: {
		trigger: 'Hiển thị các cột',
		label: 'Đang được hiển thị'
	},
	columnHeader: {
		search: 'Tìm kiếm...',
		sortAsc: 'Từ A-Z',
		sortDesc: 'Từ Z-A',
		hide: 'Ẩn cột'
	},
	pagination: {
		selected: '{{selected}} trên {{total}} hàng được chọn.',
		rowsPerPage: 'Số hàng mỗi trang',
		page: 'Trang {{page}} trên {{total}}',
		first: 'Về trang đầu',
		previous: 'Về trang trước',
		next: 'Sang trang sau',
		last: 'Sang trang cuối'
	},
	selection: {
		deleteConfirm:
			'Bạn có chắc muốn xóa các mục đã chọn không? Hành động này không thể hoàn tác!',
		deleteSuccess: 'Xóa dữ liệu thành công!',
		deleteFailed: 'Xóa dữ liệu bị lỗi!',
		confirmConfirm:
			'Bạn có chắc muốn xác nhận thông tin các mục đã chọn không? \nBạn không thể chỉnh sửa thông tin sau khi xác nhận!',
		confirmSuccess: 'Xác nhận thành công!',
		confirmFailed: 'Xác nhận thất bại!',
		count: 'Đang chọn {{count}}',
		clear: 'Bỏ chọn',
		delete: 'Xóa dữ liệu',
		confirm: 'Xác nhận thông tin quân nhân'
	},
	rowActions: {
		openMenu: 'Mở menu',
		details: 'Chi tiết',
		delete: 'Xóa',
		deleteConfirm:
			'Bạn có chắc chắn muốn xóa quân nhân này không? Hành động này không thể hoàn tác.',
		deleteSuccess: 'Xóa dữ liệu thành công!',
		deleteFailed: 'Xóa dữ liệu bị lỗi!',
		dialogTitle: 'Thông tin quân nhân',
		dialogDescription: 'Hồ sơ của {{name}}.'
	},
	cells: {
		empty: 'Chưa có thông tin...',
		updateSuccess: 'Cập nhật thông tin quân nhân thành công',
		updateFailed: 'Cập nhật thông tin quân nhân thất bại!'
	},
	error: {
		title: 'Đã xảy ra lỗi',
		retry: 'Thử lại'
	},
	toggleInput: {
		clickToEdit: 'Nhấn để chỉnh sửa...',
		search: 'Tìm kiếm...',
		noOptions: 'Không có lựa chọn nào.'
	},
	studentTable: {
		import: 'Import',
		manageTemplates: 'Quản lý mẫu',
		exportData: 'Xuất dữ liệu',
		exportRoster: 'Xuất danh sách biên chế',
		exportFile: 'Xuất file'
	},
	facetedFilter: {
		selected: 'Đã chọn {{count}}',
		noResults: 'Không tìm thấy kết quả.',
		clear: 'Xóa bộ lọc'
	}
} as const

export default table
