import { ScrollView } from 'react-native'
import { useDashboard } from '../hooks/useDashboard'
import LowStockSection from '@/src/home/components/LowStockSection'
import MetricsSection from '@/src/home/components/MetricsSection'
import BranchSummaryScreen from '../components/BranchSummaryScreen'

export default function HomeScreen () {
  const dashboard = useDashboard()
  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
      <MetricsSection dashboard={dashboard} />
      <LowStockSection dashboard={dashboard} />
      <BranchSummaryScreen dashboard={dashboard} />
    </ScrollView>
  )
}
