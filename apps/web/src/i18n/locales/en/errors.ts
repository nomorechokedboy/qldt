import type { Messages } from '../../types'
import type vi from '../vi/errors'

const errors: Messages<typeof vi> = {
	codes: {
		invalid_argument:
			'The information sent is not valid. Check the fields and try again.',
		not_found:
			'The data was not found. It may have been deleted or moved, so reload the page.',
		already_exists: 'This data already exists.',
		permission_denied:
			"You don't have permission to do this, or the data belongs to a unit outside your scope.",
		unauthenticated: 'Your session has expired. Please sign in again.',
		unavailable: 'The server is busy. Try again in a few minutes.',
		internal:
			'Something unexpected went wrong. Try again later, and tell an administrator if it keeps happening.',
		network:
			'Could not reach the server. Check your connection and try again.'
	},
	fields: {
		material_assets_serialNumber: 'This serial number',
		material_types_name: 'This material type name with the same unit',
		units_alias: 'This unit code',
		units_name: 'This unit name',
		users_username: 'This username',
		roles_name: 'This role name',
		permissions_name: 'This permission name',
		actions_name: 'This action name',
		resources_name: 'This resource name',
		unknown: 'This value'
	},
	fieldNames: {
		name: 'The name',
		serialNumber: 'The serial number'
	},
	sides: {
		source: 'sending',
		destination: 'receiving'
	},
	reasons: {
		unique_violation:
			'{{field}} is already in use. Choose a different one.',
		required_missing: 'Some required information is missing.',
		busy: 'The system is busy. Try again in a few seconds.',
		in_use_or_missing_reference:
			'This data is still used elsewhere (or points to data that no longer exists). Remove the links first, or reload the page.',
		not_pending:
			'This request has already been handled or cancelled, so it cannot be changed. Reload the page.',
		rejection_reason_required: 'Enter a reason for rejecting.',
		request_not_found:
			'Request #{{id}} was not found. It may have been deleted, so reload the page.',
		request_empty: 'Select at least one item to include in the request.',
		approver_not_eligible:
			'The chosen approver is not a commander or political commander (including deputies) with authority here. Choose someone else.',
		no_common_superior:
			'The sending and receiving units have no shared superior unit to approve this.',
		same_unit: 'The sending and receiving units must be different.',
		unit_not_found: 'The{{side}} unit (#{{id}}) was not found.',
		transfer_unit_level_too_small:
			'The{{side}} unit must be company level or higher.',
		proposal_unit_level_too_small:
			'The unit must be battalion level or higher to make this proposal.',
		trooper_not_in_source:
			'Trooper #{{id}} does not belong to the sending unit (or one of its sub-units).',
		asset_not_in_source:
			'Asset #{{id}} does not belong to the sending unit (or one of its sub-units).',
		insufficient_stock:
			'Not enough stock at the sending unit: {{requested}} needed, {{available}} available.',
		trooper_not_in_unit: 'Trooper #{{id}} no longer belongs to this unit.',
		trooper_missing_effective_date:
			'Trooper #{{id}} has no effective date.',
		trooper_missing_date_range:
			'Trooper #{{id}} has no start and end date.',
		trooper_start_after_end:
			'Trooper #{{id}}: the start date must not be after the end date.',
		trooper_in_other_proposal:
			'Trooper #{{id}} is already in another rank promotion proposal that is not finished.',
		rank_unrecognized: 'The rank "{{rank}}" is not valid.',
		rank_not_next:
			'A promotion must be to the next rank up: "{{rank}}" does not follow "{{current}}".',
		handover_not_approved:
			'A handover report can only be exported for an approved transfer request.',
		handover_no_items:
			'This transfer request has no approved items to hand over.',
		root_level_too_small: 'The root unit must be company level or higher.',
		own_parent: 'A unit cannot be its own parent.',
		parent_not_found: 'The parent unit (#{{id}}) was not found.',
		level_same_as_parent:
			"A unit's level cannot be the same as its parent's.",
		level_above_parent:
			"A unit's level cannot be higher than its parent's.",
		commander_not_found:
			'The chosen commander account (#{{ids}}) was not found.',
		root_unit_undeletable: 'The root unit cannot be deleted: {{names}}.',
		too_long: '{{field}} is longer than {{max}} characters.',
		room_not_found: 'The selected room does not exist.',
		trooper_not_found:
			'The trooper the item is assigned to does not exist.',
		room_nothing_to_reconcile:
			'This room has no assets or stock to count yet.',
		scan_app_outdated:
			'The scanning app is out of date. Update it and start a new count.',
		scan_payload_invalid:
			'The scan results do not match any open count. Scan again from the current session.',
		session_already_submitted:
			'This count already has results (status: {{status}}); they cannot be submitted again.',
		session_expired: 'This count has expired. Start a new one.',
		session_not_completed:
			'The count must be completed before it can be reviewed (current status: {{status}}).',
		session_not_reviewed:
			'The count must be reviewed before it is applied to inventory (current status: {{status}}).',
		session_already_applied:
			'This count has already been applied to inventory.'
	}
}

export default errors
