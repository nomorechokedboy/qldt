// Human-readable Vietnamese labels for known static route path segments,
// used to render the breadcrumb in Header.tsx instead of the raw kebab-case
// slug (e.g. "dai-doi" -> "Đại đội"). Segments not listed here fall back to
// a unit-alias lookup, then to the raw decoded segment as a last resort.
export const routeSegmentLabels: Record<string, string> = {
	'dai-doi': 'Đại đội',
	'trung-doi': 'Trung đội',
	'don-vi': 'Đơn vị',
	'quan-ly-don-vi': 'Quản lý đơn vị',
	'quan-ly-vat-tu': 'Quản lý vật tư',
	'danh-muc': 'Danh mục',
	'chuyen-giao-tai-san': 'Bàn giao quân số/vật chất',
	'chuyen-dang-chinh-thuc': 'Chuyển Đảng chính thức',
	'de-xuat-che-do': 'Đề xuất chế độ',
	'de-xuat-thang-quan-ham': 'Đề xuất thăng quân hàm',
	'list-user': 'Danh sách người dùng',
	'vai-tro': 'Danh sách vai trò',
	'cac-quyen': 'Phân quyền',
	'nhat-ky-hoat-dong': 'Nhật ký hoạt động',
	'chuc-vu': 'Chức vụ',
	'thong-ke-doanh-trai': 'Tổng hợp đơn vị',
	'thong-ke-chinh-tri': 'Thống kê chính trị',
	birthday: 'Sinh nhật đồng đội',
	'ethnic-minority': 'Quân nhân dân tộc thiểu số',
	hcyu: 'Quân nhân là đoàn viên',
	cpv: 'Quân nhân là đảng viên',
	religion: 'Quân nhân có tôn giáo',
	'hoan-canh-kho-khan': 'Quân nhân có hoàn cảnh khó khăn',
	profile: 'Trang cá nhân'
}
