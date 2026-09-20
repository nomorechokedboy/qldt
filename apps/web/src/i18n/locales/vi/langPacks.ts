const langPacks = {
	title: 'Gói ngôn ngữ',
	subtitle:
		'Thay đổi chữ hiển thị trên toàn hệ thống bằng cách tải lên tệp JSON cho từng ngôn ngữ.',
	status: {
		custom: 'Đang dùng gói tùy chỉnh',
		default: 'Mặc định'
	},
	dropzone: 'Kéo thả tệp .json vào đây hoặc bấm để chọn tệp',
	formatHint:
		'Tệp chỉ cần chứa các chuỗi muốn đổi, ví dụ: { "common": { "actions": { "save": "Ghi lại" } } }. Chuỗi không có trong tệp giữ nguyên giá trị mặc định.',
	downloadTemplate: 'Tải tệp mẫu mặc định',
	reset: 'Khôi phục mặc định',
	loading: 'Đang tải…',
	uploading: 'Đang tải lên…',
	result: {
		applied: 'Đã áp dụng {{count}} chuỗi.',
		ignored:
			'Đã bỏ qua {{count}} khóa không có trong hệ thống hoặc sai cấu trúc:',
		placeholders:
			'{{count}} chuỗi có biến thay thế khác với bản gốc, có thể hiển thị sai:'
	},
	confirmReset: {
		title: 'Khôi phục gói mặc định?',
		description:
			'Toàn bộ chuỗi tùy chỉnh của ngôn ngữ {{language}} sẽ bị xóa và hệ thống dùng lại chữ mặc định.',
		cancel: 'Hủy',
		confirm: 'Khôi phục'
	},
	toast: {
		uploaded: 'Đã cập nhật gói ngôn ngữ {{language}}',
		uploadFailed: 'Không thể cập nhật gói ngôn ngữ',
		resetDone: 'Đã khôi phục gói ngôn ngữ {{language}} về mặc định',
		resetFailed: 'Không thể khôi phục gói ngôn ngữ'
	},
	errors: {
		notJsonFile: 'Chỉ nhận tệp có đuôi .json',
		tooLarge: 'Tệp vượt quá {{kb}} KB',
		notJson: 'Nội dung tệp không phải JSON hợp lệ',
		notObject:
			'Tệp phải là một đối tượng JSON dạng { "namespace": { "khóa": "giá trị" } }',
		invalidValue: 'Giá trị tại "{{path}}" phải là chuỗi',
		nothingToApply: 'Tệp không có chuỗi nào khớp với hệ thống'
	}
} as const

export default langPacks
