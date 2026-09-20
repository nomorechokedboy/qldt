const io = {
	importDialog: {
		title: 'Import danh sách quân nhân',
		description:
			'Tải lên file Excel hoặc CSV để thêm nhiều quân nhân cùng lúc.',
		messages: {
			refErrors:
				'Đã đọc file, nhưng có {{count}} dòng chứa lỗi tham chiếu (đơn vị/chức vụ không hợp lệ).',
			readFormat: 'Lỗi đọc file. Vui lòng kiểm tra định dạng file.',
			readRetry: 'Lỗi đọc file. Vui lòng thử lại.',
			invalidType: 'Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)',
			noFile: 'Vui lòng chọn file để import',
			fixRefErrors:
				'Vui lòng sửa các dòng có lỗi tham chiếu trước khi import.',
			processing: 'Đang xử lý file...',
			done: 'Import hoàn tất! Thành công: {{success}}/{{total}} quân nhân',
			failed: 'Lỗi import: {{message}}'
		},
		results: {
			title: 'Kết quả import:',
			success: 'Thành công',
			errors: 'Lỗi',
			total: 'Tổng cộng',
			details: 'Chi tiết lỗi:',
			row: 'Dòng {{row}}: {{message}}'
		},
		actions: {
			close: 'Đóng',
			cancel: 'Hủy',
			importing: 'Đang import...',
			confirm: 'Xác nhận & Import',
			fixErrorsTooltip: 'Vui lòng sửa các dòng có lỗi trước khi import'
		},
		upload: {
			steps: {
				download: 'Tải xuống file mẫu',
				fill: 'Điền thông tin quân nhân theo định dạng mẫu',
				upload: 'Tải file lên và nhấn Import'
			},
			template: {
				title: 'File mẫu Excel',
				hint: 'Tải xuống để có cấu trúc dữ liệu chính xác',
				download: 'Tải xuống'
			},
			choose: 'Chọn file để import',
			another: 'Chọn file khác',
			dropBefore: 'Kéo thả file vào đây hoặc',
			dropLink: 'chọn file',
			supported: 'Hỗ trợ file CSV, Excel (.xlsx, .xls)'
		},
		review: {
			title: 'Xem trước dữ liệu import',
			hint: 'Kiểm tra và chỉnh sửa dữ liệu bên dưới trước khi import vào hệ thống',
			another: 'Chọn file khác',
			total: 'Tổng số:',
			valid: 'Hợp lệ: {{count}}',
			errors: 'Lỗi: {{count}}',
			empty: 'Không có dữ liệu',
			help: 'Xem cột "{{status}}" của từng dòng để biết dòng nào còn lỗi - di chuột vào nhãn "{{error}}" để xem chi tiết. Lỗi quê quán/trú quán có thể sửa ngay trong bảng - dùng nút "{{columns}}" ở trên để bật các cột Tỉnh/Thành và Phường/Xã tương ứng.'
		},
		columns: {
			status: 'Trạng thái',
			fullName: 'Họ và tên',
			studentId: 'Mã số QN',
			unit: 'Đơn vị',
			position: 'Chức vụ',
			rank: 'Cấp bậc',
			dob: 'Ngày sinh',
			phone: 'SĐT',
			activityStatus: 'Tình trạng',
			birthProvince: 'Tỉnh/Thành (Quê quán)',
			birthWard: 'Phường/Xã (Quê quán)',
			birthDetail: 'Chi tiết (Quê quán)',
			addressProvince: 'Tỉnh/Thành (Trú quán)',
			addressWard: 'Phường/Xã (Trú quán)',
			addressDetail: 'Chi tiết (Trú quán)'
		},
		placeholders: {
			unit: '-- Chọn đơn vị --',
			position: '-- Chọn chức vụ --',
			activityStatus: '-- Chọn tình trạng --',
			province: '-- Chọn tỉnh/thành --',
			ward: '-- Chọn phường/xã --'
		},
		rowStatus: { error: 'Lỗi', ok: 'OK' },
		cells: {
			search: 'Tìm kiếm...',
			notFound: 'Không tìm thấy.',
			pickDate: 'Chọn ngày'
		}
	},
	studentReview: {
		title: 'Xem lại thông tin nhập liệu',
		personal: 'Thông tin cá nhân',
		military: 'Thông tin quân nhân',
		family: 'Thông tin gia đình',
		fields: {
			fullName: 'Họ và tên:',
			birthPlace: 'Quê quán:',
			address: 'Trú quán:',
			ethnic: 'Dân tộc:',
			religion: 'Tôn giáo:',
			educationLevel: 'Trình độ học vấn:',
			schoolName: 'Tên trường:',
			major: 'Ngành:',
			phone: 'Phone:',
			dob: 'Sinh nhật:',
			enlistmentPeriod: 'Ngày nhập ngũ:',
			previousUnit: 'Đơn vị cũ:',
			previousPosition: 'Chức vụ tại đơn vị cũ:',
			policyBeneficiaryGroup: 'Diện chính sách:',
			name: 'Tên:',
			phoneNumber: 'SĐT:',
			job: 'Nghề:'
		},
		father: 'Cha',
		mother: 'Mẹ'
	},
	export: {
		fields: {
			filename: 'Tên file',
			unitName: 'Tên đơn vị',
			underUnitName: 'Tên đơn vị trực thuộc',
			reportTitle: 'Tiêu đề báo cáo',
			city: 'Địa danh',
			commanderPosition: 'Chức vụ chỉ huy',
			commanderName: 'Tên chỉ huy',
			commanderRank: 'Cấp bậc của chỉ huy'
		},
		required: {
			filename: 'Tên file không được bỏ trống',
			unitName: 'Tên đơn vị không được bỏ trống',
			underUnitName: 'Tên đơn vị trực thuộc không được bỏ trống',
			reportTitle: 'Tiêu đề báo cáo không được bỏ trống',
			city: 'Địa danh không được bỏ trống',
			commanderPosition: 'Chức vụ chỉ huy không được bỏ trống',
			commanderName: 'Tên chỉ huy không được bỏ trống',
			commanderRank: 'Cấp bậc của chỉ huy không được bỏ trống'
		},
		cancel: 'Hủy',
		confirm: 'Xác nhận',
		exporting: 'Đang xuất file...',
		failed: 'Chưa thể xuất file, đã có lỗi xảy ra!',
		description: 'Hãy điền những thông tin cần thiết để xuất dữ liệu',
		generic: { title: 'Xuất dữ liệu' },
		students: {
			title: 'Xuất dữ liệu học viên',
			columns: 'Cột dữ liệu muốn xuất',
			template: 'Mẫu xuất dữ liệu',
			defaultTemplate: 'Mặc định',
			noColumns: 'Hãy chọn ít nhất một cột để xuất dữ liệu'
		},
		materialAssets: { title: 'Xuất dữ liệu vũ khí/trang bị' },
		materialStocks: { title: 'Xuất dữ liệu vật tư sinh hoạt' },
		roster: {
			title: 'Xuất danh sách biên chế',
			description:
				'Danh sách biên chế của đơn vị này và toàn bộ đơn vị trực thuộc, phân theo từng đơn vị'
		}
	},
	preview: {
		title: 'Xem trước file xuất',
		download: 'Tải xuống',
		downloading: 'Đang tải xuống...',
		failed: 'Chưa thể tải file, đã có lỗi xảy ra!'
	},
	templates: {
		title: 'Quản lý mẫu xuất dữ liệu',
		description:
			'Tải lên mẫu docx của riêng bạn để dùng khi xuất dữ liệu, hoặc xóa mẫu không còn dùng nữa',
		tabs: { mine: 'Mẫu của tôi', guideline: 'Hướng dẫn' },
		columns: { name: 'Tên mẫu', filename: 'Tên file' },
		nameLabel: 'Tên mẫu',
		namePlaceholder: 'Ví dụ: Mẫu báo cáo vũ khí',
		fileLabel: 'File mẫu (.docx)',
		upload: 'Tải lên',
		uploading: 'Đang tải lên...',
		loading: 'Đang tải...',
		empty: 'Chưa có mẫu nào',
		pickFile: 'Hãy chọn file mẫu (.docx)',
		nameRequired: 'Hãy đặt tên cho mẫu',
		uploaded: 'Đã tải lên mẫu xuất dữ liệu',
		uploadFailed: 'Không thể tải lên mẫu, đã có lỗi xảy ra!'
	},
	guideline: {
		example: {
			title: 'Mẫu ví dụ',
			description:
				'Tải mẫu docx đã sử dụng sẵn các biến bên dưới để tham khảo hoặc chỉnh sửa lại theo ý bạn',
			download: 'Tải mẫu ví dụ',
			downloading: 'Đang tải...',
			failed: 'Không thể tải mẫu ví dụ, đã có lỗi xảy ra!'
		},
		general: {
			title: 'Các biến thông tin chung',
			variable: 'Biến',
			meaning: 'Ý nghĩa'
		},
		letterhead: {
			unitName: 'Tên đơn vị',
			underUnitName: 'Tên đơn vị trực thuộc',
			city: 'Địa danh',
			day: 'Ngày lập báo cáo',
			month: 'Tháng lập báo cáo',
			year: 'Năm lập báo cáo',
			reportTitle: 'Tiêu đề báo cáo',
			commanderPosition: 'Chức vụ người chỉ huy',
			commanderRank: 'Cấp bậc người chỉ huy',
			commanderName: 'Họ tên người chỉ huy'
		},
		table: {
			title: 'Bảng dữ liệu',
			body: 'Dữ liệu bảng được chèn bằng vòng lặp <code>columns</code> (tiêu đề cột) và <code>rows</code> (từng dòng dữ liệu). Tên cột do hệ thống tự tạo dựa trên loại dữ liệu bạn xuất, ví dụ với vũ khí/trang bị: "Số sê-ri", "Loại khí tài", "Tình trạng"...'
		},
		detail: {
			title: 'Dữ liệu chi tiết (cho bảng phức tạp)',
			body: 'Nếu bảng <code>rows</code>/<code>columns</code> ở trên không đủ (ví dụ cần gộp nhiều thông tin vào một ô, hoặc liệt kê danh sách con/em có số lượng thay đổi theo từng quân nhân), hãy dùng biến <code>troopers</code> — danh sách đầy đủ, chưa được rút gọn, của các quân nhân đã chọn. Xuống dòng trong một ô (<code>{{lineBreak}}</code> hoặc phím Enter trong Word) vẫn hoạt động bình thường, và bạn có thể lồng vòng lặp cho các trường dạng danh sách như <code>childrenInfos</code> hoặc <code>siblings</code>:',
			fieldsTitle: 'Các trường có sẵn trên mỗi quân nhân',
			field: 'Trường'
		},
		trooper: {
			fullName: 'Họ và tên',
			dob: 'Ngày sinh',
			rank: 'Cấp bậc',
			position: 'Chức vụ',
			previousUnit: 'Đơn vị cũ',
			previousPosition: 'Chức vụ cũ',
			birthPlace: 'Quê quán',
			address: 'Trú quán',
			enlistmentPeriod: 'Thời gian nhập ngũ',
			ethnic: 'Dân tộc',
			religion: 'Tôn giáo',
			educationLevel: 'Học vấn',
			schoolName: 'Tên trường',
			major: 'Chuyên ngành',
			isGraduated: "Đã tốt nghiệp ('Có'/'Không')",
			phone: 'Số điện thoại',
			policyBeneficiaryGroup: 'Đối tượng chính sách',
			politicalOrg: "Đoàn/Đảng ('hcyu' hoặc 'cpv')",
			politicalOrgOfficialDate: 'Ngày vào Đoàn chính thức',
			cpvId: 'Số thẻ Đảng',
			cpvOfficialAt: 'Ngày vào Đảng chính thức',
			shortcoming: 'Khuyết điểm',
			talent: 'Tài năng',
			fatherName: 'Họ tên bố',
			fatherJob: 'Nghề nghiệp của bố',
			fatherPhoneNumber: 'SĐT bố',
			motherName: 'Họ tên mẹ',
			motherJob: 'Nghề nghiệp của mẹ',
			motherPhoneNumber: 'SĐT mẹ',
			isMarried: "Đã kết hôn ('Có'/'Không')",
			spouseName: 'Họ tên vợ/chồng',
			spouseJob: 'Nghề nghiệp vợ/chồng',
			spousePhoneNumber: 'SĐT vợ/chồng',
			familySize: 'Số nhân khẩu',
			familyBackground: 'Thành phần gia đình',
			achievement: 'Thành tích',
			disciplinaryHistory: 'Kỷ luật',
			studentId: 'Mã học viên',
			status: "Trạng thái ('pending' hoặc 'confirmed')",
			unitName: 'Tên đơn vị',
			childrenInfos: 'Danh sách con (mảng {fullName, dob})',
			siblings: 'Danh sách anh/chị/em (mảng {fullName, dob})',
			contactPerson: 'Người liên hệ ({name, phoneNumber, address})'
		}
	}
} as const

export default io
