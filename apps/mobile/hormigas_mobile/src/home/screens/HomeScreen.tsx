import LowStockSection from '@/src/home/components/LowStockSection'
import MetricsSection from '@/src/home/components/MetricsSection'
import { ScrollView } from 'react-native'
import BranchSummaryScreen from '../components/BranchSummaryScreen'

export default function HomeScreen () {
  return (
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <MetricsSection />
        <LowStockSection />
        <BranchSummaryScreen />
      </ScrollView>
  )
}