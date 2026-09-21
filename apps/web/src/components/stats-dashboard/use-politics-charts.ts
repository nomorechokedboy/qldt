import { skipToken, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { GetPoliticsQualityReport } from '@/api'
import {
	COLORS as POLITICS_CHART_COLORS,
	politicalOrgNameMapping,
	type PieChartData
} from '@/components/politics-quality-report/charts-section'
import useProvinces from '@/hooks/useProvinces'
import { transformPoliticsQualityData } from '@/lib/utils'

function toPieData(
	record: Record<string, number> | undefined,
	labelMap?: Record<string, string>
): PieChartData[] {
	return Object.entries(record ?? {}).map(([name, value], idx) => ({
		name: labelMap?.[name] ?? name,
		value,
		color: POLITICS_CHART_COLORS[idx % POLITICS_CHART_COLORS.length]
	}))
}

// The unit's political-quality report, shaped as pie-chart slices. Called by
// the page rather than by the card that shows it, so the request goes out
// alongside the unit stats instead of after them.
export default function usePoliticsCharts(unitId: number | undefined) {
	const { t } = useTranslation('units')
	const { data, isLoading } = useQuery({
		queryKey: ['politics-quality-report', unitId],
		queryFn:
			unitId === undefined
				? skipToken
				: () => GetPoliticsQualityReport([unitId])
	})
	const { data: provinces = [] } = useProvinces()

	const report = transformPoliticsQualityData(data)[0]?.politicsQualityReport
	const provinceNames: Record<string, string> = {
		unknown: t('dashboard.unknown'),
		...Object.fromEntries(provinces.map((p) => [p.code, p.nameWithType]))
	}
	const charts = {
		education: toPieData(report?.educationLevel),
		ethnic: toPieData(report?.ethnic),
		religion: toPieData(report?.religion),
		politicalOrg: toPieData(report?.politicalOrg, politicalOrgNameMapping),
		birthPlace: toPieData(report?.birthPlaceProvince, provinceNames)
	}

	return {
		isLoading,
		charts,
		hasData: Object.values(charts).some((slices) => slices.length > 0)
	}
}

export type PoliticsCharts = ReturnType<typeof usePoliticsCharts>
