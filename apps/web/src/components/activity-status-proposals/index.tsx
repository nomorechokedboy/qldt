import ProposalsTab from '@/components/proposals/proposals-tab'
import { activityStatusAdapter } from './adapter'

export default function ActivityStatusProposalsTab() {
	return <ProposalsTab adapter={activityStatusAdapter} />
}
