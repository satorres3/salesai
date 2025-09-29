import { router, publicProcedure } from '../trpc'
import { DashboardService } from '@/lib/csv-repository'

export const dashboardRouter = router({
  // Get dashboard statistics
  stats: publicProcedure.query(async () => {
    return DashboardService.getStats()
  }),
})