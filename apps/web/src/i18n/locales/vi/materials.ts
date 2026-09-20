const materials = {
	categories: {
		furniture: 'Đồ nội thất',
		equipment: 'Trang thiết bị',
		weapon: 'Vũ khí',
		vehicle: 'Phương tiện'
	},
	assetStatus: {
		in_service: 'Đang sử dụng',
		damaged: 'Hư hỏng',
		lost: 'Mất',
		retired: 'Đã thanh lý'
	},
	condition: {
		good: 'Tốt',
		fair: 'Khá',
		needs_maintenance: 'Cần bảo dưỡng',
		damaged: 'Hư hỏng'
	},
	import: {
		cancel: 'Hủy',
		close: 'Đóng',
		fixErrorsFirst: 'Vui lòng sửa các dòng có lỗi trước khi import',
		importing: 'Đang import...',
		confirm: 'Xác nhận & Import',
		results: {
			title: 'Kết quả import:',
			success: 'Thành công',
			errors: 'Lỗi',
			total: 'Tổng cộng',
			errorDetails: 'Chi tiết lỗi:',
			row: 'Dòng {{row}}: {{message}}'
		},
		review: {
			status: 'Trạng thái',
			error: 'Lỗi',
			title: 'Xem trước dữ liệu import',
			description:
				'Kiểm tra và chỉnh sửa dữ liệu bên dưới trước khi import vào hệ thống',
			chooseAnother: 'Chọn file khác',
			total: 'Tổng số:',
			valid: 'Hợp lệ: {{count}}',
			errorCount: 'Lỗi: {{count}}',
			empty: 'Không có dữ liệu',
			hint: 'Di chuột vào nhãn "Lỗi" của từng dòng để xem chi tiết.'
		},
		upload: {
			step1: 'Tải xuống file mẫu',
			step2: 'Điền thông tin {{itemNoun}} theo định dạng mẫu',
			step3: 'Tải file lên và nhấn Import',
			templateTitle: 'File mẫu Excel',
			templateHint: 'Tải xuống để có cấu trúc dữ liệu chính xác',
			download: 'Tải xuống',
			chooseHeading: 'Chọn file để import',
			chooseAnother: 'Chọn file khác',
			dropHint: 'Kéo thả file vào đây hoặc',
			pick: 'chọn file',
			supported: 'Hỗ trợ file CSV, Excel (.xlsx, .xls)'
		},
		state: {
			unsupportedFile: 'Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)',
			readFailed: 'Lỗi đọc file. Vui lòng thử lại.',
			badFormat: 'Lỗi đọc file. Vui lòng kiểm tra định dạng file.',
			noFile: 'Vui lòng chọn file để import',
			fixReferenceErrors:
				'Vui lòng sửa các dòng có lỗi tham chiếu trước khi import.',
			processing: 'Đang xử lý file...',
			done: 'Import hoàn tất! Thành công: {{success}}/{{total}} {{itemNoun}}',
			failed: 'Lỗi import: {{message}}',
			templateFailed: 'Lỗi tạo file: {{message}}'
		}
	},
	importAssets: {
		title: 'Import vũ khí/trang bị',
		description:
			'Tải lên file Excel hoặc CSV để thêm nhiều khí tài cùng lúc.',
		itemNoun: 'khí tài',
		referenceErrors:
			'Đã đọc file, nhưng có {{count}} dòng chứa lỗi tham chiếu (khí tài/đơn vị/vị trí/quân nhân không hợp lệ).',
		columns: {
			materialType: 'Loại khí tài',
			serialNumber: 'Số sê-ri',
			unit: 'Đơn vị',
			room: 'Vị trí',
			condition: 'Tình trạng',
			status: 'Trạng thái sử dụng',
			assignedTrooper: 'Cấp phát cho quân nhân'
		},
		pickMaterialType: '-- Chọn loại khí tài --',
		defaultCondition: '-- Mặc định (Tốt) --',
		defaultStatus: '-- Mặc định (Đang sử dụng) --'
	},
	importStocks: {
		title: 'Import vật tư sinh hoạt',
		description:
			'Tải lên file Excel hoặc CSV để thêm nhiều vật tư cùng lúc.',
		itemNoun: 'vật tư',
		referenceErrors:
			'Đã đọc file, nhưng có {{count}} dòng chứa lỗi tham chiếu (vật tư/đơn vị/vị trí không hợp lệ).',
		columns: {
			materialType: 'Loại vật tư',
			unit: 'Đơn vị',
			room: 'Vị trí',
			quantity: 'Số lượng',
			condition: 'Tình trạng'
		},
		pickMaterialType: '-- Chọn loại vật tư --'
	},
	importShared: {
		pickUnit: '-- Chọn đơn vị --'
	},
	shared: {
		noSpecificRoom: 'Chưa có vị trí cụ thể',
		notAssigned: 'Chưa cấp phát',
		noValue: '—'
	},
	actions: {
		edit: 'Chỉnh sửa',
		update: 'Cập nhật',
		delete: 'Xóa'
	},
	columns: {
		images: 'Hình ảnh',
		name: 'Tên vật tư',
		category: 'Phân loại',
		unitOfMeasure: 'Đơn vị tính',
		managementType: 'Loại quản lý',
		serialNumber: 'Số sê-ri',
		assetType: 'Loại khí tài',
		stockType: 'Loại vật tư',
		unit: 'Đơn vị',
		room: 'Vị trí',
		assignedTo: 'Cấp phát cho',
		quantity: 'Số lượng',
		condition: 'Tình trạng',
		status: 'Trạng thái'
	},
	assetTable: {
		allocate: 'Cấp phát / cập nhật',
		history: 'Lịch sử',
		downloadQr: 'Tải mã QR',
		editTitle: 'Cập nhật khí tài',
		confirmDelete:
			'Bạn có chắc muốn xoá khí tài "{{name}}"? Hành động này không thể hoàn tác.',
		deleted: 'Xóa khí tài thành công!',
		deleteFailed: 'Xóa khí tài thất bại!'
	},
	stockTable: {
		editTitle: 'Cập nhật vật tư',
		confirmDelete:
			'Bạn có chắc muốn xoá vật tư "{{name}}"? Hành động này không thể hoàn tác.',
		deleted: 'Xóa vật tư thành công!',
		deleteFailed: 'Xóa vật tư thất bại!'
	},
	typeTable: {
		bySerial: 'Theo số sê-ri',
		byQuantity: 'Theo số lượng',
		editTitle: 'Chỉnh sửa danh mục vật tư',
		confirmDelete:
			'Bạn có chắc muốn xoá danh mục "{{name}}"? Hành động này không thể hoàn tác.',
		deleted: 'Xóa danh mục vật tư thành công!',
		deleteFailed: 'Xóa danh mục vật tư thất bại!'
	},
	assetQr: {
		title: 'Mã QR khí tài - {{serial}}',
		ariaLabel: 'Mã QR khí tài {{serial}}',
		hint: 'In và dán mã này lên khí tài. Tình trạng tại thời điểm in: {{condition}}. Khi kiểm kê, tình trạng thực tế vẫn cần được xác nhận lại.'
	},
	assetHistory: {
		title: 'Lịch sử khí tài',
		empty: 'Chưa có lịch sử thay đổi.',
		from: 'Từ:',
		to: '→ Đến:',
		by: 'Thực hiện bởi: {{name}}',
		unknownUnit: 'Không rõ đơn vị',
		noRoom: 'Chưa có vị trí',
		events: {
			assigned: 'Cấp phát',
			unassigned: 'Thu hồi',
			condition_changed: 'Đổi tình trạng',
			status_changed: 'Đổi trạng thái',
			transferred: 'Chuyển đơn vị/vị trí'
		}
	},
	form: {
		cancel: 'Hủy',
		add: 'Thêm',
		adding: 'Đang thêm...',
		save: 'Lưu',
		saving: 'Đang lưu...',
		unit: 'Thuộc đơn vị',
		pickUnit: 'Chọn đơn vị',
		pickRoomOptional: 'Chọn vị trí (tuỳ chọn)',
		pickCondition: 'Chọn tình trạng'
	},
	assetForm: {
		trigger: 'Thêm khí tài',
		title: 'Biểu mẫu thêm khí tài/vũ khí',
		created: 'Thêm mới khí tài thành công',
		createFailed: 'Thêm mới khí tài thất bại!',
		pickType: 'Chọn loại khí tài',
		pickRoom: 'Chọn phòng (tuỳ chọn)',
		assignTrooper: 'Cấp phát cho quân nhân',
		pickTrooperOptional: 'Chọn quân nhân (tuỳ chọn)'
	},
	assetEdit: {
		updated: 'Cập nhật khí tài thành công',
		updateFailed: 'Cập nhật khí tài thất bại!',
		pickStatus: 'Chọn trạng thái',
		pickTrooper: 'Chọn quân nhân',
		note: 'Ghi chú thay đổi',
		notePlaceholder: 'Lý do thay đổi (tuỳ chọn)'
	},
	stockForm: {
		trigger: 'Thêm vật tư',
		title: 'Biểu mẫu thêm vật tư',
		created: 'Thêm vật tư thành công',
		createFailed: 'Thêm vật tư thất bại!',
		pickType: 'Chọn loại vật tư'
	},
	stockEdit: {
		updated: 'Cập nhật vật tư thành công',
		updateFailed: 'Cập nhật vật tư thất bại!'
	},
	typeForm: {
		trigger: 'Thêm danh mục',
		title: 'Biểu mẫu thêm danh mục vật tư',
		created: 'Thêm mới danh mục vật tư thành công',
		createFailed: 'Thêm mới danh mục vật tư thất bại!',
		namePlaceholder: 'vd: Súng AK, Ghế, Giường',
		pickCategory: 'Chọn phân loại',
		uomPlaceholder: 'vd: cái, chiếc, bộ',
		serialized: 'Quản lý theo số sê-ri riêng lẻ (vũ khí, xe, ...)'
	},
	typeEdit: {
		updated: 'Cập nhật danh mục vật tư thành công',
		updateFailed: 'Cập nhật danh mục vật tư thất bại!',
		serialized: 'Quản lý theo số sê-ri riêng lẻ'
	},
	imagesUpload: {
		remove: 'Xóa ảnh',
		add: 'Thêm ảnh'
	},
	qrCode: {
		tooLarge: 'Không thể tạo mã QR - dữ liệu quá lớn cho một mã QR.',
		download: 'Tải xuống mã QR'
	},
	inventory: {
		diffStatus: {
			matched: 'Khớp',
			missing: 'Thiếu',
			extra: 'Phát sinh',
			condition_changed: 'Đổi tình trạng'
		},
		stockDiffStatus: {
			matched: 'Khớp',
			short: 'Thiếu',
			over: 'Dư',
			extra: 'Phát sinh'
		},
		sessionStatus: {
			in_progress: 'Đang kiểm kê',
			completed: 'Chờ xác nhận',
			reviewed: 'Đã xác nhận',
			expired: 'Đã hết hạn'
		},
		diff: {
			empty: 'Không có dữ liệu chênh lệch.',
			expectedCondition: 'Tình trạng dự kiến:',
			observedCondition: 'Tình trạng thực tế:',
			none: 'Không có'
		},
		stockDiff: {
			empty: 'Không có vật tư kiểm kê theo số lượng.',
			quantities: 'Dự kiến: {{expected}} - Thực tế: {{observed}}'
		},
		challengeQrLabel: 'Mã QR phiên kiểm kê',
		scanner: {
			cameraDenied:
				'Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.',
			noQrInImage:
				'Không tìm thấy mã QR trong ảnh, vui lòng thử ảnh khác.',
			unreadableImage: 'Không đọc được ảnh này, vui lòng thử ảnh khác.',
			uploadInstead: 'Bạn có thể tải lên ảnh chụp mã QR thay thế.',
			uploadOptional:
				'Hoặc tải lên ảnh chụp mã QR nếu không dùng được camera.',
			upload: 'Tải ảnh lên'
		},
		dialog: {
			triggerTitle: 'Kiểm kê bằng mã QR',
			title: 'Kiểm kê - {{roomName}}',
			intro: 'Tạo mã QR để bắt đầu phiên kiểm kê vũ khí/trang bị trong phòng này. Dùng ứng dụng trên điện thoại để quét mã và kiểm kê ngoại tuyến.',
			checking: 'Đang kiểm tra phiên...',
			creating: 'Đang tạo...',
			create: 'Tạo mã QR kiểm kê',
			createFailed: 'Không thể tạo phiên kiểm kê cho phòng này',
			challengeSummary:
				'{{assets}} vật tư cần kiểm kê, {{stocks}} dòng vật tư theo số lượng cần kiểm đếm. Quét mã này bằng ứng dụng trên điện thoại, sau khi hoàn tất kiểm kê hãy bấm nút bên dưới để quét lại kết quả.',
			scanResults: 'Quét kết quả từ điện thoại',
			retryScan: 'Quét lại',
			recording: 'Đang ghi nhận kết quả...',
			aimAtQr: 'Đưa mã QR kết quả trên điện thoại vào khung hình.',
			invalidQr: 'Mã QR không hợp lệ, vui lòng thử lại',
			wrongFormat: 'Mã QR không đúng định dạng kết quả kiểm kê',
			submitFailed:
				'Không thể ghi nhận kết quả kiểm kê - mã QR có thể đã bị thay đổi hoặc phiên đã đóng',
			reviewedNote: 'Đã xác nhận kiểm tra kết quả này.',
			confirming: 'Đang xác nhận...',
			confirm: 'Xác nhận đã kiểm tra',
			confirmed: 'Đã xác nhận kiểm tra kết quả kiểm kê',
			confirmFailed: 'Không thể xác nhận kết quả kiểm kê',
			done: 'Xong'
		},
		history: {
			title: 'Lịch sử kiểm kê - {{roomName}}',
			loading: 'Đang tải...',
			completedAt: 'Hoàn thành lúc:',
			notCompleted: 'Chưa hoàn thành',
			sessionStatus: 'Trạng thái của phiên',
			status: 'Trạng thái',
			allStatuses: 'Tất cả trạng thái',
			dateRange: 'Khoảng ngày',
			empty: 'Phòng này chưa có phiên kiểm kê nào.',
			createdAt: 'Tạo lúc:',
			loadMore: 'Tải thêm'
		},
		apply: {
			title: 'Áp dụng vào tồn kho',
			applied: 'Kết quả kiểm kê đã được áp dụng vào tồn kho.',
			automatic:
				'Tự động áp dụng: {{missing}} tài sản sẽ được đánh dấu "Mất", {{conditionChanged}} tài sản sẽ được cập nhật tình trạng.',
			extraAssets: 'Tài sản phát sinh - chọn để chuyển vào phòng này',
			stockLines: 'Dòng vật tư chênh lệch - chọn để cập nhật số lượng',
			observedQuantity: 'thực tế {{count}}',
			applying: 'Đang áp dụng...',
			success:
				'Đã áp dụng vào tồn kho: {{missing}} thiếu, {{conditionChanged}} đổi tình trạng, {{extraAssets}} tài sản phát sinh, {{stockLines}} dòng vật tư',
			failed: 'Không thể áp dụng kết quả kiểm kê vào tồn kho'
		}
	},
	catalog: {
		title: 'Danh mục vật tư',
		searchPlaceholder: 'Tìm kiếm theo tên vật tư...',
		empty: 'Chưa có danh mục vật tư nào'
	}
	// __END__
} as const

export default materials
