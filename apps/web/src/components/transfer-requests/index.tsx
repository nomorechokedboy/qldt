import ProposalsTab from '@/components/proposals/proposals-tab'
import { transferRequestAdapter } from './adapter'

export default function TransferRequestsTab() {
	return <ProposalsTab adapter={transferRequestAdapter} />
}
