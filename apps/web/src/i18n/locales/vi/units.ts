const units = {
	levels: {
		squad: 'Tiểu đội',
		platoon: 'Trung đội',
		company: 'Đại đội',
		battalion: 'Tiểu đoàn',
		department: 'Cơ quan',
		regiment: 'Trung đoàn',
		brigade: 'Lữ đoàn',
		division: 'Sư đoàn',
		corps: 'Quân đoàn'
	},
	filters: {
		unit: 'Đơn vị',
		rank: 'Cấp bậc',
		ethnic: 'Dân tộc',
		educationLevel: 'Trình độ học vấn',
		status: 'Trạng thái',
		statusPending: 'Chưa xác nhận',
		statusConfirmed: 'Đã xác nhận'
	},
	select: {
		placeholder: 'Chọn đơn vị'
	},
	tabs: {
		students: 'Quân nhân',
		platoons: 'Trung đội',
		squads: 'Tiểu đội',
		facilities: 'Cơ sở vật chất',
		weapons: 'Vũ khí/trang bị',
		noStudentInfo: 'Chưa có thông tin quân nhân.'
	},
	pageHeader: {
		subtitle: 'Quản lý quân nhân, cơ sở vật chất và vũ khí/trang bị'
	},
	form: {
		name: 'Tên đơn vị',
		alias: 'Mã định danh (alias)',
		aliasExample: 'vd: d1, c1',
		level: 'Cấp đơn vị',
		levelPlaceholder: 'Chọn cấp đơn vị',
		parent: 'Thuộc đơn vị',
		parentPlaceholder: 'Chọn đơn vị cấp trên',
		noParent: 'Không có (đơn vị gốc)',
		cancel: 'Huỷ',
		cancelAlt: 'Hủy',
		loading: 'Đang tải...',
		add: 'Thêm',
		adding: 'Đang thêm...',
		update: 'Cập nhật',
		updating: 'Đang cập nhật...',
		addButton: 'Thêm đơn vị',
		addTitle: 'Biểu mẫu thêm đơn vị',
		createSuccess: 'Thêm mới đơn vị thành công',
		createFailed: 'Thêm mới đơn vị thất bại!',
		updateSuccess: 'Cập nhật thông tin đơn vị thành công',
		updateFailed: 'Cập nhật thông tin đơn vị thất bại!',
		levelLocked:
			'Chỉ quản trị viên hệ thống mới có thể thay đổi cấp đơn vị',
		parentLocked:
			'Chỉ quản trị viên hệ thống mới có thể thay đổi đơn vị cấp trên'
	},
	platoonForm: {
		addButton: 'Thêm trung đội',
		title: 'Biểu mẫu thêm trung đội',
		name: 'Tên trung đội',
		aliasExample: 'vd: b1, b2',
		createSuccess: 'Thêm mới trung đội thành công',
		createFailed: 'Thêm mới trung đội thất bại!'
	},
	squadForm: {
		addButton: 'Thêm tiểu đội',
		title: 'Biểu mẫu thêm tiểu đội',
		name: 'Tên tiểu đội',
		aliasExample: 'vd: a1, a2',
		platoon: 'Thuộc trung đội',
		platoonPlaceholder: 'Chọn trung đội',
		platoonRequired: 'Vui lòng chọn trung đội',
		createSuccess: 'Thêm mới tiểu đội thành công',
		createFailed: 'Thêm mới tiểu đội thất bại!'
	},
	commanders: {
		commander: 'Chỉ huy trưởng',
		deputyCommander: 'Phó chỉ huy trưởng',
		politicalCommander: 'Chính ủy',
		deputyPoliticalCommander: 'Phó chính ủy',
		platoonCommander: 'Trung đội trưởng',
		squadCommander: 'Tiểu đội trưởng',
		choose: 'Chọn {{label}}',
		unassigned: 'Chưa chỉ định'
	},
	card: {
		rootBadge: 'Đơn vị gốc',
		aliasLine: 'Mã định danh: {{alias}}',
		parentSuffix: ' · Thuộc {{name}}',
		childCount: 'Số đơn vị trực thuộc: {{count}}',
		manage: 'Quản lý đơn vị',
		edit: 'Chỉnh sửa',
		delete: 'Xoá',
		deleting: 'Đang xoá...',
		cancel: 'Huỷ',
		editTitle: 'Chỉnh sửa đơn vị',
		deleteTitle: 'Xác nhận xoá đơn vị',
		deleteHeading: 'Xác nhận xoá đơn vị?',
		deleteConfirm:
			'Bạn có chắc muốn xoá đơn vị <name>{{name}}</name> không?',
		irreversible: 'Hành động này <strong>không thể hoàn tác.</strong>',
		deleteSuccess: 'Đã xoá đơn vị "{{name}}" thành công!',
		deleteFailed: 'Có lỗi xảy ra khi xoá đơn vị'
	},
	materialTables: {
		import: 'Import',
		manageTemplates: 'Quản lý mẫu',
		export: 'Xuất file',
		searchSupplyType: 'Tìm kiếm theo loại vật tư...',
		searchSerial: 'Tìm kiếm theo số sê-ri...',
		unit: 'Đơn vị',
		supplyType: 'Loại vật tư',
		assetType: 'Loại khí tài',
		condition: 'Tình trạng',
		status: 'Trạng thái',
		room: 'Vị trí',
		noRoom: 'Chưa có vị trí cụ thể'
	},
	rollup: {
		noStudents: 'Không có quân nhân nào',
		noSupplies: 'Không có vật tư sinh hoạt nào',
		noAssets: 'Không có vũ khí/trang bị nào'
	},
	company: {
		facilitiesTitle: 'Cơ sở vật chất của {{name}}',
		noBuildings: 'Đơn vị chưa có nhà/khu nhà nào.',
		suppliesTitle: 'Vật tư sinh hoạt',
		noSupplies: 'Đơn vị chưa có vật tư sinh hoạt nào',
		weaponsTitle: 'Vũ khí/trang bị của {{name}}',
		noWeapons: 'Đơn vị chưa có vũ khí/trang bị nào',
		squadListTitle: 'Danh sách tiểu đội của {{name}}',
		platoonListTitle: 'Danh sách trung đội của {{name}}',
		needPlatoonFirst:
			'Đại đội chưa có trung đội nào. Cần tạo trung đội trước khi thêm tiểu đội.',
		noSquads: 'Đại đội chưa có tiểu đội nào.',
		noPlatoons: 'Đại đội chưa có trung đội nào.',
		studentListTitle: 'Danh sách quân nhân',
		studentListSubtitle: 'Đây là danh sách quân nhân của {{name}}'
	},
	dashboard: {
		title: 'Thống kê đơn vị',
		subtitle:
			'Tổng hợp quân số, cơ sở vật chất và vũ khí/trang bị của đơn vị và toàn bộ đơn vị trực thuộc.',
		noUnitAssigned: 'Bạn chưa được phân công đơn vị nào để xem thống kê.',
		overview: 'Tổng quan',
		details: 'Chi tiết',
		unknown: 'Chưa xác định',
		quantity: 'Số lượng',
		kpiTotalTroops: 'Tổng quân số',
		kpiBuildings: 'Nhà/khu nhà',
		kpiRooms: 'Phòng',
		kpiScope: '{{name}} và đơn vị trực thuộc',
		troopSq: 'SQ',
		troopQncn: 'QNCN',
		troopHsq: 'HSQ',
		troopBs: 'CS (BS)',
		subordinateStructure: 'Cơ cấu đơn vị trực thuộc',
		noSubordinates: 'Đơn vị này không có đơn vị trực thuộc nào.',
		troopStructure: 'Cơ cấu quân số',
		noTroopData: 'Chưa có dữ liệu quân số.',
		troopStats: 'Thống kê quân số',
		noTroopStats: 'Chưa có dữ liệu thống kê quân số.',
		education: 'Trình độ văn hóa',
		ethnic: 'Dân tộc',
		religion: 'Tôn giáo',
		politicalOrg: 'Đoàn/Đảng',
		birthPlace: 'Quê quán (Tỉnh/Thành)',
		supplies: 'Vật tư sinh hoạt',
		noSupplies: 'Chưa có vật tư sinh hoạt nào.',
		weapons: 'Vũ khí/trang bị',
		noWeapons: 'Chưa có vũ khí/trang bị nào.'
	},
	management: {
		title: 'Quản lý đơn vị',
		empty: 'Chưa có đơn vị nào.'
	},
	home: {
		title: 'Hệ thống Quản lý đơn vị & VKTBKT',
		description:
			'Nền tảng giúp quản lý thông tin đơn vị nhanh chóng, dễ dàng và chính xác. Bạn có thể thêm mới, chỉnh sửa, tìm kiếm và thống kê quân số, vật tư và VKTBKT của đơn vị.',
		manageUnits: 'Quản lý đơn vị',
		unitStats: 'Thống kê đơn vị'
	},
	initialize: {
		firstTime: 'Khởi tạo lần đầu',
		adminNotice:
			'Tài khoản quản trị viên này sẽ có toàn bộ quyền truy cập hệ thống và dữ liệu.',
		rootUnit: {
			title: 'Khởi tạo đơn vị',
			description:
				'Hệ thống chưa có đơn vị nào. Hãy khởi tạo đơn vị gốc của đơn vị trước khi tiếp tục sử dụng.',
			name: 'Tên đơn vị',
			alias: 'Mã định danh (alias)',
			aliasExample: 'vd: d1',
			level: 'Cấp đơn vị',
			levelPlaceholder: 'Chọn cấp đơn vị',
			submit: 'Khởi tạo đơn vị',
			submitting: 'Đang khởi tạo...',
			success: 'Khởi tạo đơn vị thành công!',
			failed: 'Khởi tạo đơn vị thất bại, đã có lỗi xảy ra!'
		},
		admin: {
			title: 'Khởi tạo quản trị viên',
			description:
				'Hãy khởi tạo tài khoản quản trị viên của bạn để sử dụng hệ thống',
			displayName: 'Họ và tên',
			username: 'Tên đăng nhập',
			password: 'Mật khẩu',
			confirmPassword: 'Mật khẩu xác nhận',
			submit: 'Khởi tạo',
			submitting: 'Đang khởi tạo...',
			success: 'Khởi tạo tài khoản quản trị thành công!',
			successDescription: 'Bây giờ bạn đã có thể đăng nhập vào hệ thống.',
			failed: 'Khởi tạo tài khoản quản trị thất bại, đã có lỗi xảy ra, vui lòng liên hệ kỹ thuật viên!',
			usernameRequired: 'Tên đăng nhập không được bỏ trống',
			displayNameRequired: 'Họ và tên không được bỏ trống',
			passwordMin: 'Mật khẩu phải có ít nhất 8 ký tự',
			passwordUpper: 'Mật khẩu phải chứa ít nhất 1 chữ hoa',
			passwordLower: 'Mật khẩu phải chứa ít nhất 1 chữ thường',
			passwordDigit: 'Mật khẩu phải chứa ít nhất 1 chữ số',
			confirmRequired: 'Vui lòng xác nhận mật khẩu',
			confirmMismatch: 'Mật khẩu xác nhận không khớp'
		}
	},
	facilities: {
		common: {
			description: 'Mô tả',
			cancel: 'Hủy',
			dismiss: 'Huỷ',
			add: 'Thêm',
			adding: 'Đang thêm...',
			save: 'Lưu',
			saving: 'Đang lưu...',
			edit: 'Chỉnh sửa',
			delete: 'Xoá',
			deleting: 'Đang xoá...'
		},
		building: {
			trigger: 'Thêm nhà/khu nhà',
			formTitle: 'Biểu mẫu thêm nhà/khu nhà',
			name: 'Tên nhà/khu nhà',
			namePlaceholder: 'vd: Nhà đại đội 1',
			unit: 'Thuộc đơn vị',
			pickUnit: 'Chọn đơn vị',
			created: 'Thêm mới nhà/khu nhà thành công',
			createFailed: 'Thêm mới nhà/khu nhà thất bại!',
			updated: 'Cập nhật nhà/khu nhà thành công',
			updateFailed: 'Cập nhật nhà/khu nhà thất bại!',
			deleted: 'Đã xoá nhà "{{name}}" thành công!',
			deleteFailed: 'Có lỗi xảy ra khi xoá nhà',
			roomCount: 'Số phòng: {{count}}',
			manageRooms: 'Quản lý phòng',
			editTitle: 'Chỉnh sửa nhà',
			deleteDialogTitle: 'Xác nhận xoá nhà',
			deleteHeading: 'Xác nhận xoá nhà?',
			deleteConfirm:
				'Bạn có chắc muốn xoá nhà <name>{{name}}</name> không?',
			irreversible: 'Hành động này <b>không thể hoàn tác.</b>',
			roomsTitle: 'Danh sách phòng - {{name}}'
		},
		room: {
			trigger: 'Thêm phòng',
			formTitle: 'Biểu mẫu thêm phòng',
			name: 'Tên phòng',
			namePlaceholder: 'vd: Phòng trung đội trưởng',
			type: 'Loại phòng',
			typePlaceholder: 'vd: phòng ở, kho, phòng chỉ huy',
			created: 'Thêm mới phòng thành công',
			createFailed: 'Thêm mới phòng thất bại!',
			updated: 'Cập nhật phòng thành công',
			updateFailed: 'Cập nhật phòng thất bại!',
			deleteConfirm: 'Bạn có chắc muốn xoá phòng "{{name}}"?',
			deleted: 'Xoá phòng thành công',
			deleteFailed: 'Xoá phòng thất bại!',
			empty: 'Nhà này chưa có phòng nào.',
			inventoryHistory: 'Lịch sử kiểm kê',
			editTitle: 'Chỉnh sửa phòng'
		}
	}
} as const

export default units
