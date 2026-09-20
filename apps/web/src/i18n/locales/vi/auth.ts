const auth = {
	brand: {
		unit: 'Lữ đoàn 75, Quân khu 7',
		product: 'Phần mềm quản lý đơn vị và vũ khí trang bị',
		tagline:
			'Quân số, vũ khí trang bị và vật tư của đơn vị, gói trong một hệ thống.'
	},
	login: {
		title: 'Đăng nhập',
		subtitle: 'Dùng tài khoản do đơn vị cấp.',
		username: 'Tên đăng nhập',
		password: 'Mật khẩu',
		usernameRequired: 'Tên đăng nhập là bắt buộc',
		passwordRequired: 'Mật khẩu là bắt buộc',
		submit: 'Đăng nhập',
		submitting: 'Đang đăng nhập...',
		forgot: 'Quên mật khẩu? Liên hệ quản trị viên đơn vị để được cấp lại.',
		version: 'Phiên bản {{version}}',
		success: 'Đăng nhập thành công',
		failed: 'Đăng nhập thất bại'
	},
	password: {
		show: 'Hiện mật khẩu',
		hide: 'Ẩn mật khẩu'
	}
} as const

export default auth
