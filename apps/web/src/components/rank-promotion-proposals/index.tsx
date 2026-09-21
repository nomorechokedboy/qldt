import ProposalsTab from '@/components/proposals/proposals-tab'
import { rankPromotionAdapter } from './adapter'

export default function RankPromotionProposalsTab() {
	return <ProposalsTab adapter={rankPromotionAdapter} />
}
