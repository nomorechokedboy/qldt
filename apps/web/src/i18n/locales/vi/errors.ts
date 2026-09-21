// Messages for what the server reports when a request fails. `reasons` are the
// stable causes the API sends in `details.reason`; `codes` are the fallback
// for a failure that arrives without one.
export default {
	codes: {
		invalid_argument:
			'Thông tin gửi lên không hợp lệ. Hãy kiểm tra lại các trường rồi thử lại.',
		not_found:
			'Không tìm thấy dữ liệu. Có thể dữ liệu đã bị xóa hoặc chuyển đi, hãy tải lại trang.',
		already_exists: 'Dữ liệu này đã tồn tại.',
		permission_denied:
			'Bạn không có quyền thực hiện thao tác này, hoặc dữ liệu thuộc đơn vị ngoài phạm vi của bạn.',
		unauthenticated: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
		unavailable: 'Máy chủ đang bận. Hãy thử lại sau ít phút.',
		internal:
			'Hệ thống gặp lỗi ngoài dự kiến. Hãy thử lại sau, nếu vẫn lỗi hãy báo quản trị viên.',
		network:
			'Không kết nối được tới máy chủ. Hãy kiểm tra đường truyền rồi thử lại.'
	},
	fields: {
		material_assets_serialNumber: 'Số hiệu (serial) này',
		material_types_name: 'Tên loại vật tư cùng đơn vị tính này',
		units_alias: 'Mã đơn vị này',
		units_name: 'Tên đơn vị này',
		users_username: 'Tên đăng nhập này',
		roles_name: 'Tên vai trò này',
		permissions_name: 'Tên quyền này',
		actions_name: 'Tên hành động này',
		resources_name: 'Tên tài nguyên này',
		unknown: 'Giá trị này'
	},
	fieldNames: {
		name: 'Tên',
		serialNumber: 'Số hiệu (serial)'
	},
	sides: {
		source: 'gửi',
		destination: 'nhận'
	},
	reasons: {
		unique_violation:
			'{{field}} đã được sử dụng. Hãy chọn một giá trị khác.',
		required_missing: 'Còn thiếu thông tin bắt buộc.',
		busy: 'Hệ thống đang bận xử lý. Hãy thử lại sau vài giây.',
		in_use_or_missing_reference:
			'Dữ liệu này đang được dùng ở nơi khác (hoặc tham chiếu tới dữ liệu không còn tồn tại). Hãy gỡ liên kết trước, hoặc tải lại trang.',
		not_pending:
			'Yêu cầu này đã được xử lý hoặc đã bị hủy nên không thể thao tác thêm. Hãy tải lại trang.',
		rejection_reason_required: 'Hãy nhập lý do từ chối.',
		request_not_found:
			'Không tìm thấy yêu cầu #{{id}}. Có thể đã bị xóa, hãy tải lại trang.',
		request_empty: 'Cần chọn ít nhất một mục để đưa vào yêu cầu.',
		approver_not_eligible:
			'Người duyệt được chọn không phải chỉ huy hoặc chính trị viên (kể cả cấp phó) có thẩm quyền. Hãy chọn người khác.',
		no_common_superior:
			'Đơn vị gửi và đơn vị nhận không có đơn vị cấp trên chung để duyệt.',
		same_unit: 'Đơn vị gửi và đơn vị nhận phải khác nhau.',
		unit_not_found: 'Không tìm thấy đơn vị{{side}} (#{{id}}).',
		transfer_unit_level_too_small:
			'Đơn vị{{side}} phải từ cấp đại đội trở lên.',
		proposal_unit_level_too_small:
			'Đơn vị phải từ cấp tiểu đoàn trở lên mới lập được đề nghị này.',
		trooper_not_in_source:
			'Quân nhân #{{id}} không thuộc đơn vị gửi (hoặc đơn vị trực thuộc).',
		asset_not_in_source:
			'Trang bị #{{id}} không thuộc đơn vị gửi (hoặc đơn vị trực thuộc).',
		insufficient_stock:
			'Không đủ vật tư tại đơn vị gửi: cần {{requested}}, hiện có {{available}}.',
		trooper_not_in_unit: 'Quân nhân #{{id}} không còn thuộc đơn vị này.',
		trooper_missing_effective_date:
			'Quân nhân #{{id}} chưa có ngày hiệu lực.',
		trooper_missing_date_range:
			'Quân nhân #{{id}} chưa có ngày bắt đầu và ngày kết thúc.',
		trooper_start_after_end:
			'Quân nhân #{{id}}: ngày bắt đầu không được sau ngày kết thúc.',
		trooper_in_other_proposal:
			'Quân nhân #{{id}} đang nằm trong một đề nghị thăng quân hàm khác chưa hoàn tất.',
		rank_unrecognized: 'Quân hàm "{{rank}}" không hợp lệ.',
		rank_not_next:
			'Chỉ được thăng lên quân hàm liền kề: "{{rank}}" không phải cấp kế tiếp của "{{current}}".',
		handover_not_approved:
			'Chỉ xuất được biên bản bàn giao cho yêu cầu chuyển đã được duyệt.',
		handover_no_items:
			'Yêu cầu này không có vật tư nào được duyệt để bàn giao.',
		root_level_too_small: 'Đơn vị gốc phải từ cấp đại đội trở lên.',
		own_parent: 'Một đơn vị không thể là đơn vị cấp trên của chính nó.',
		parent_not_found: 'Không tìm thấy đơn vị cấp trên (#{{id}}).',
		level_same_as_parent:
			'Cấp của đơn vị không được trùng cấp đơn vị cấp trên.',
		level_above_parent:
			'Cấp của đơn vị không được lớn hơn đơn vị cấp trên.',
		commander_not_found:
			'Không tìm thấy tài khoản chỉ huy được chọn (#{{ids}}).',
		root_unit_undeletable: 'Không thể xóa đơn vị gốc: {{names}}.',
		too_long: '{{field}} dài quá {{max}} ký tự.',
		room_not_found: 'Phòng đã chọn không tồn tại.',
		trooper_not_found: 'Quân nhân được cấp phát không tồn tại.',
		room_nothing_to_reconcile:
			'Phòng này chưa có trang bị hay vật tư nào để kiểm kê.',
		scan_app_outdated:
			'Ứng dụng quét đã cũ so với hệ thống. Hãy cập nhật ứng dụng rồi bắt đầu phiên kiểm kê mới.',
		scan_payload_invalid:
			'Kết quả quét không khớp với phiên kiểm kê nào đang mở. Hãy quét lại từ phiên hiện tại.',
		session_already_submitted:
			'Phiên kiểm kê này đã nhận kết quả (trạng thái: {{status}}), không nộp lại được.',
		session_expired: 'Phiên kiểm kê đã hết hạn. Hãy bắt đầu phiên mới.',
		session_not_completed:
			'Phiên kiểm kê phải hoàn tất trước khi xem xét (trạng thái hiện tại: {{status}}).',
		session_not_reviewed:
			'Phiên kiểm kê phải được xem xét trước khi áp dụng vào kho (trạng thái hiện tại: {{status}}).',
		session_already_applied:
			'Phiên kiểm kê này đã được áp dụng vào kho rồi.'
	}
} as const
