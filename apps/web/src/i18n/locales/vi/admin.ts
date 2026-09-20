const admin = {
	common: {
		add: 'Thêm',
		adding: 'Đang thêm...',
		cancel: 'Hủy',
		delete: 'Xóa',
		details: 'Chi tiết',
		edit: 'Chỉnh sửa',
		loading: 'Đang tải...',
		loadingMore: 'Đang tải...',
		notProvided: 'Chưa có thông tin',
		retryLater: 'Vui lòng thử lại sau.',
		save: 'Lưu lại',
		saveShort: 'Lưu',
		saving: 'Đang lưu...'
	},
	access: {
		deniedTitle: 'Không có quyền truy cập',
		deniedBody:
			'Bạn không có quyền để xem nội dung này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.'
	},
	users: {
		title: 'Danh sách người dùng',
		add: 'Thêm người dùng',
		columns: {
			displayName: 'Họ và tên',
			username: 'Tên tài khoản',
			unit: 'Đơn vị',
			rank: 'Cấp bậc',
			position: 'Chức vụ',
			createdAt: 'Ngày tạo',
			actions: 'Thao tác'
		},
		fields: {
			displayName: 'Họ và tên',
			username: 'Tên tài khoản',
			password: 'Mật khẩu',
			unit: 'Đơn vị',
			rank: 'Cấp bậc',
			position: 'Chức vụ',
			accountType: 'Loại tài khoản',
			selectUnit: 'Chọn đơn vị',
			selectRank: 'Chọn cấp bậc',
			selectPosition: 'Chọn chức vụ'
		},
		accountTypes: {
			admin: 'Tài khoản quản trị',
			regular: 'Tài khoản thường'
		},
		actions: { assignRoles: 'Phân quyền' },
		info: {
			title: 'Thông tin người dùng',
			adminBadge: 'Quản trị viên',
			regularUser: 'Người dùng'
		},
		create: {
			title: 'Biểu mẫu thêm người dùng',
			success: 'Thêm mới người dùng thành công',
			failed: 'Thêm mới người dùng thất bại'
		},
		edit: {
			title: 'Biểu mẫu sửa thông tin người dùng',
			newPassword: 'Mật khẩu mới (để trống nếu không đổi)',
			newPasswordPlaceholder: 'Nhập mật khẩu mới',
			confirmPassword: 'Xác nhận mật khẩu',
			success: 'Sửa người dùng thành công',
			failed: 'Sửa người dùng thất bại'
		},
		delete: {
			confirm:
				'Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.',
			success: 'Xóa dữ liệu thành công!',
			failed: 'Lỗi xóa dữ liệu!'
		},
		unlock: {
			title: 'Mở khóa đăng nhập',
			action: 'Mở khóa',
			tooltip:
				'Tài khoản đang bị khóa đăng nhập do nhập sai mật khẩu nhiều lần. Nhấn để mở khóa.',
			description:
				'Tài khoản <username>{{username}}</username> đang bị khóa đăng nhập do nhập sai mật khẩu quá số lần cho phép. Bạn có chắc chắn muốn mở khóa ngay bây giờ không?',
			success: 'Đã mở khóa đăng nhập cho người dùng',
			failed: 'Mở khóa đăng nhập thất bại'
		},
		validation: {
			displayNameRequired: 'Họ và tên không được bỏ trống',
			usernameRequired: 'Tên tài khoản không được bỏ trống',
			passwordRequired: 'Mật khẩu không được bỏ trống',
			unitRequired: 'Đơn vị không được bỏ trống',
			passwordMin: 'Mật khẩu phải có ít nhất 6 ký tự'
		}
	},
	assignRoles: {
		title: 'Phân quyền cho {{name}}',
		empty: 'Chưa có vai trò nào trong hệ thống',
		save: 'Lưu thay đổi',
		success: 'Cập nhật quyền thành công',
		failed: 'Có lỗi xảy ra khi cập nhật quyền'
	},
	roles: {
		searchPlaceholder: 'Tìm kiếm...',
		empty: 'Chưa có vai trò...',
		permissionCount: '{{count}} quyền',
		userCount: '{{count}} người dùng',
		fields: { name: 'Tên quyền', description: 'Mô tả' },
		create: {
			trigger: 'Tạo quyền',
			title: 'Tạo vai trò mới',
			action: 'Thêm mới',
			loading: 'Đang thêm...',
			success: 'Thêm mới vai trò thành công!',
			failed: 'Thêm mới vai trò thất bại.'
		},
		update: {
			title: 'Chỉnh sửa vai trò',
			action: 'Chỉnh sửa',
			loading: 'Đang chỉnh sửa...',
			success: 'Chỉnh sửa vai trò thành công!',
			failed: 'Chỉnh sửa vai trò thất bại.'
		},
		delete: {
			dialogTitle: 'Xác nhận xoá vai trò',
			heading: 'Xác nhận xoá vai trò?',
			confirm:
				'Bạn có chắc muốn xoá vai trò <name>{{name}}</name> không?',
			irreversible: 'Hành động này <b>không thể hoàn tác.</b>',
			cancel: 'Huỷ',
			action: 'Xoá',
			deleting: 'Đang xoá...',
			success: 'Xóa vai trò thành công!',
			failed: 'Xóa vai trò thất bại.'
		}
	},
	permissions: {
		searchPlaceholder: 'Tìm kiếm quyền...',
		createTrigger: 'Tạo quyền',
		empty: 'Chưa có quyền nào',
		usedBy: 'Dùng bởi {{count}} vai trò',
		fields: {
			name: 'Tên quyền',
			displayName: 'Tên hiển thị',
			description: 'Mô tả',
			resource: 'Tài nguyên',
			action: 'Hành động'
		},
		create: {
			success: 'Thêm mới thành công!',
			failed: 'Thêm mới thất bại.'
		},
		assign: {
			trigger: 'Các quyền',
			title: 'Gán quyền cho vai trò {{name}}',
			description: 'Hãy chọn các quyền mà vai trò này sẽ có'
		}
	},
	positions: {
		title: 'Chức vụ',
		searchPlaceholder: 'Tìm kiếm theo tên chức vụ...',
		empty: 'Chưa có chức vụ nào',
		columns: {
			priority: 'Ưu tiên',
			code: 'Mã chức vụ',
			name: 'Tên chức vụ'
		},
		fields: {
			code: 'Mã chức vụ',
			codePlaceholder: 'vd: tlts, nvqk, y tá',
			name: 'Tên chức vụ',
			namePlaceholder: 'vd: Trợ lý tác chiến',
			priority: 'Thứ tự ưu tiên (số càng nhỏ càng ưu tiên trước)',
			hsq: 'Chức vụ Hạ sĩ quan (HSQ)'
		},
		create: {
			trigger: 'Thêm chức vụ',
			title: 'Biểu mẫu thêm chức vụ',
			success: 'Thêm mới chức vụ thành công',
			failed: 'Thêm mới chức vụ thất bại!'
		},
		update: {
			title: 'Chỉnh sửa chức vụ',
			success: 'Cập nhật chức vụ thành công',
			failed: 'Cập nhật chức vụ thất bại!'
		},
		delete: {
			confirm:
				'Bạn có chắc muốn xoá chức vụ "{{name}}"? Hành động này không thể hoàn tác.',
			success: 'Xóa chức vụ thành công!',
			failed: 'Xóa chức vụ thất bại!'
		}
	},
	audit: {
		title: 'Nhật ký hoạt động',
		allResources: 'Tất cả tài nguyên',
		allActions: 'Tất cả hành động',
		empty: 'Không có nhật ký nào',
		view: 'Xem',
		previous: 'Trước',
		next: 'Sau',
		pagination: 'Trang {{page}} / {{totalPages}} ({{total}} bản ghi)',
		detailTitle: 'Chi tiết nhật ký',
		columns: {
			time: 'Thời gian',
			actor: 'Người thực hiện',
			resource: 'Tài nguyên',
			action: 'Hành động'
		},
		resources: {
			students: 'Quân nhân',
			material_assets: 'Vũ khí/trang bị',
			material_types: 'Danh mục vật tư',
			material_stocks: 'Tồn kho vật tư',
			buildings: 'Tòa nhà',
			rooms: 'Phòng',
			units: 'Đơn vị',
			roles: 'Vai trò',
			permissions: 'Quyền',
			users: 'Người dùng',
			user_roles: 'Phân quyền người dùng',
			transfer_requests: 'Yêu cầu bàn giao',
			inventory_sessions: 'Phiên kiểm kê'
		},
		actions: {
			create: 'Tạo mới',
			update: 'Cập nhật',
			delete: 'Xoá',
			approve: 'Phê duyệt',
			reject: 'Từ chối'
		}
	},
	profile: {
		title: 'Trang cá nhân',
		view: {
			editInfo: 'Chỉnh sửa thông tin',
			personal: 'Thông tin cá nhân',
			login: 'Thông tin đăng nhập',
			system: 'Thông tin hệ thống',
			createdAt: 'Ngày tạo',
			updatedAt: 'Ngày cập nhật'
		},
		edit: {
			title: 'Chỉnh sửa thông tin cá nhân',
			success: 'Cập nhật thông tin thành công',
			failed: 'Cập nhật thông tin thất bại'
		},
		password: {
			title: 'Đổi mật khẩu',
			current: 'Mật khẩu hiện tại',
			currentPlaceholder: 'Nhập mật khẩu hiện tại',
			new: 'Mật khẩu mới',
			newPlaceholder: 'Nhập mật khẩu mới (tối thiểu 6 ký tự)',
			confirm: 'Xác nhận mật khẩu mới',
			confirmPlaceholder: 'Nhập lại mật khẩu mới',
			success: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
			incorrect: 'Mật khẩu hiện tại không đúng',
			failed: 'Đổi mật khẩu thất bại'
		},
		validation: {
			prevPasswordRequired: 'Mật khẩu hiện tại không được bỏ trống',
			passwordMin: 'Mật khẩu mới phải có ít nhất 6 ký tự',
			confirmRequired: 'Vui lòng xác nhận mật khẩu',
			passwordMismatch: 'Mật khẩu xác nhận không khớp'
		}
	},
	notifications: {
		today: 'Hôm nay',
		yesterday: 'Hôm qua',
		empty: 'Chưa có thông báo nào',
		noMore: 'Không còn thông báo mới',
		loadFailed: 'Không thể tải thông báo'
	}
} as const

export default admin
