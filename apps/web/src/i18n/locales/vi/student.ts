const student = {
	steps: {
		personal: {
			title: 'Thông tin cá nhân',
			hint: 'Họ tên, nơi ở, học vấn'
		},
		other: {
			title: 'Thông tin khác',
			hint: 'Cấp bậc, chức vụ, chính trị'
		},
		parent: {
			title: 'Thông tin bố mẹ',
			hint: 'Cha, mẹ, anh chị em'
		},
		family: {
			title: 'Thông tin vợ/chồng và con',
			hint: 'Vợ/chồng và con'
		}
	},
	wizard: {
		add: 'Thêm quân nhân',
		adding: 'Đang thêm quân nhân...',
		description: 'Điền lần lượt {{count}} bước để tạo hồ sơ quân nhân.',
		stepOf: 'Bước {{current}}/{{total}}: {{title}}',
		stepsNav: 'Các bước',
		done: 'Đã xong',
		back: 'Quay lại',
		next: 'Tiếp theo',
		created: 'Thêm mới quân nhân thành công!',
		createFailed: 'Thêm mới quân nhân thất bại!'
	},
	editForm: {
		title: 'Chỉnh sửa quân nhân',
		cancel: 'Hủy',
		save: 'Lưu thay đổi',
		saving: 'Đang lưu...',
		saveFailed: 'Chỉnh sửa thông tin quân nhân không thành công!'
	},
	info: {
		title: 'Thông tin quân nhân',
		studentId: 'Mã quân nhân: {{id}}',
		noStudentId: 'chưa có',
		confirmed: 'Đã xác nhận',
		yes: 'Có',
		notYet: 'Chưa',
		married: 'Đã kết hôn',
		single: 'Độc thân',
		noChildren: 'Chưa có thông tin con cái',
		noSiblings: 'Chưa có thông tin anh chị em'
	},
	actions: {
		downloadSummary: 'Tải trích ngang',
		confirm: 'Xác nhận',
		confirmPrompt:
			'Bạn có chắc chắn muốn xác nhận thông tin quân nhân này không? Bạn sẽ không thể chỉnh sửa thông tin quân nhân sau khi xác nhận.',
		confirmSuccess: 'Xác nhận quân nhân thành công!',
		confirmFailed: 'Xác nhận quân nhân thất bại!',
		edit: 'Chỉnh sửa',
		editTitle: 'Chỉnh sửa thông tin quân nhân',
		editDescription: 'Sửa hồ sơ của {{name}}.'
	},
	record: {
		sectionsNav: 'Các mục',
		sections: {
			personal: {
				label: 'Thông tin cá nhân',
				hint: 'Họ tên, nơi ở, liên lạc'
			},
			military: {
				label: 'Quân sự & Chính trị',
				hint: 'Cấp bậc, chức vụ, chính trị'
			},
			education: {
				label: 'Học vấn & Kỹ năng',
				hint: 'Trường lớp, sở trường'
			},
			family: {
				label: 'Gia đình',
				hint: 'Cha mẹ, vợ chồng, con'
			},
			history: {
				label: 'Lịch sử & Khác',
				hint: 'Khen thưởng, kỷ luật, tài liệu'
			}
		},
		cover: {
			fullName: 'Họ và tên',
			rank: 'Cấp bậc',
			position: 'Chức vụ',
			unit: 'Đơn vị'
		},
		photo: {
			alt: 'Ảnh 3x4 của quân nhân',
			choose: 'Chọn ảnh 3x4',
			change: 'Đổi ảnh',
			inputLabel: 'Ảnh quân nhân',
			formats: 'JPG, PNG hoặc WebP, tối đa 2 MB',
			tooLarge: 'Ảnh vượt quá 2 MB, hãy chọn ảnh nhỏ hơn.'
		}
	},
	sections: {
		identity: 'Họ tên và nhận dạng',
		workUnit: 'Đơn vị công tác',
		places: 'Quê quán và trú quán',
		birthPlaceLabel: 'Quê quán',
		addressLabel: 'Trú quán',
		ethnicityReligionEducation: 'Dân tộc, tôn giáo và học vấn',
		ethnicityReligion: 'Dân tộc và tôn giáo',
		military: 'Quân sự',
		politics: 'Chính trị',
		contact: 'Người báo tin',
		contactHint: 'Người cần liên lạc khi có việc của quân nhân.',
		remarks: 'Nhận xét',
		education: 'Học vấn',
		skillsAndPolicy: 'Kỹ năng và chính sách',
		household: 'Gia cảnh',
		father: 'Cha',
		mother: 'Mẹ',
		siblings: 'Anh, chị, em ruột',
		siblingsCount: 'Anh, chị, em ruột ({{count}})',
		spouse: 'Vợ/chồng',
		spouseHint: 'Bỏ trống nếu quân nhân chưa kết hôn.',
		children: 'Con',
		childrenCount: 'Con ({{count}})',
		familyBackground: 'Hoàn cảnh gia đình',
		history: 'Lịch sử',
		documents: 'Tài liệu'
	},
	fields: {
		fullName: 'Họ và tên',
		name: 'Họ tên',
		dob: 'Ngày sinh',
		phone: 'Số điện thoại',
		address: 'Địa chỉ',
		job: 'Nghề nghiệp',
		unit: 'Đơn vị',
		ethnic: 'Dân tộc',
		religion: 'Tôn giáo',
		rank: 'Cấp bậc',
		position: 'Chức vụ',
		enlistmentDate: 'Ngày nhập ngũ',
		activityStatus: 'Tình trạng',
		youthJoinDate: 'Ngày vào Đoàn',
		partyJoinDate: 'Ngày vào Đảng',
		cpvId: 'Số thẻ Đảng',
		previousUnit: 'Đơn vị cũ',
		previousPosition: 'Chức vụ cũ',
		talent: 'Sở trường',
		shortcoming: 'Sở đoản',
		discipline: 'Kỷ luật',
		policyGroup: 'Đối tượng chính sách',
		graduated: 'Đã tốt nghiệp',
		documents: 'Hồ sơ đi kèm',
		childName: 'Họ và tên con',
		siblingName: 'Họ và tên anh/chị/em'
	},
	create: {
		studentId: 'Mã số quân nhân',
		educationLevel: 'Trình độ học vấn',
		schoolName: 'Tên trường',
		major: 'Ngành',
		politicalOrg: 'Đoàn/Đảng',
		contactName: 'Khi cần báo tin cho',
		achievement: 'Thành tích',
		familySize: 'Số thành viên trong gia đình',
		birthOrder: 'Con thứ bao nhiêu',
		familyBackground: 'Sơ lược hoàn cảnh gia đình',
		fatherName: 'Tên cha',
		fatherDob: 'Ngày sinh của cha',
		fatherJob: 'Nghề nghiệp cha',
		fatherPhone: 'Số điện thoại cha',
		motherName: 'Tên mẹ',
		motherDob: 'Ngày sinh mẹ',
		motherJob: 'Nghề nghiệp mẹ',
		motherPhone: 'Số điện thoại mẹ',
		spouseName: 'Tên vợ/chồng',
		spouseDob: 'Ngày sinh của vợ/chồng',
		spousePhone: 'Số điện thoại vợ/chồng',
		spouseJob: 'Nghề nghiệp vợ/chồng',
		datePlaceholder: 'Ngày/tháng/năm',
		chooseUnit: 'Chọn đơn vị',
		chooseEthnic: 'Chọn dân tộc',
		chooseReligion: 'Chọn tôn giáo',
		chooseEducation: 'Chọn trình độ học vấn',
		chooseRank: 'Chọn cấp bậc',
		choosePosition: 'Chọn chức vụ',
		chooseStatus: 'Chọn tình trạng'
	},
	recordFields: {
		studentId: 'Mã quân nhân',
		schoolName: 'Trường',
		major: 'Chuyên ngành',
		educationLevel: 'Trình độ',
		politicalOrg: 'Tổ chức',
		achievement: 'Khen thưởng',
		familySize: 'Số lượng thành viên',
		birthOrder: 'Con thứ mấy',
		familyBackground: 'Hoàn cảnh gia đình',
		married: 'Đã kết hôn',
		spouseName: 'Họ tên vợ/chồng',
		spousePhone: 'SĐT vợ/chồng',
		status: 'Tình trạng'
	},
	place: {
		birthPlace: 'quê quán',
		address: 'trú quán',
		province: 'Tỉnh/Thành ({{place}})',
		ward: 'Phường/Xã ({{place}})',
		street: 'Số nhà, đường ({{place}})',
		chooseProvince: 'Chọn tỉnh/thành',
		chooseWard: 'Chọn phường/xã',
		chooseProvinceFirst: 'Chọn tỉnh/thành trước'
	},
	people: {
		childTitle: 'Con thứ {{n}}',
		addChild: 'Thêm thông tin con cái',
		childPlaceholder: 'Họ và tên con...',
		siblingTitle: 'Anh/chị/em thứ {{n}}',
		addSibling: 'Thêm thông tin anh/chị/em',
		siblingPlaceholder: 'Họ và tên anh/chị/em...'
	},
	validation: {
		dateFormat: 'Hãy dùng định dạng Ngày/tháng/năm',
		invalidDate: 'Ngày không hợp lệ',
		editDateFormat: 'Hãy nhập ngày theo định dạng dd/mm/yyyy',
		fullNameRequired: 'Họ và tên không được bỏ trống',
		ethnicRequired: 'Dân tộc không được bỏ trống',
		religionRequired: 'Tôn giáo không được bỏ trống',
		educationRequired: 'Trình độ học vấn không được bỏ trống',
		positionRequired: 'Chức vụ không được bỏ trống',
		nameRequired: 'Họ tên không được bỏ trống'
	}
} as const

export default student
