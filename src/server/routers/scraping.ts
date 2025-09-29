import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { scrapingService } from '../../lib/scraping-service'
import { ScrapingJobSchema, ScrapedEventSchema } from '../../lib/scraping-types'

export const scrapingRouter = router({
  startJob: publicProcedure
    .input(
      z.object({
        url: z.string().url()
      })
    )
    .mutation(async ({ input }) => {
      const jobId = await scrapingService.startJob(input.url)
      return { jobId, message: 'Scraping job started successfully' }
    }),

  getJobStatus: publicProcedure
    .input(
      z.object({
        jobId: z.string()
      })
    )
    .query(async ({ input }) => {
      const job = await scrapingService.getJobStatus(input.jobId)
      if (!job) {
        throw new Error('Scraping job not found')
      }
      return job
    }),

  getJobEvents: publicProcedure
    .input(
      z.object({
        jobId: z.string()
      })
    )
    .query(async ({ input }) => {
      return scrapingService.getJobEvents(input.jobId)
    }),

  getAllJobs: publicProcedure
    .query(async () => {
      return scrapingService.getAllJobs()
    }),

  getRecentJobs: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10)
      })
    )
    .query(async ({ input }) => {
      const jobs = await scrapingService.getAllJobs()
      return jobs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, input.limit)
    }),

  cancelJob: publicProcedure
    .input(
      z.object({
        jobId: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const success = await scrapingService.cancelJob(input.jobId)
      if (!success) {
        throw new Error('Failed to cancel job or job already completed')
      }
      return { message: 'Job cancelled successfully' }
    }),

  getStats: publicProcedure
    .query(async () => {
      const jobs = await scrapingService.getAllJobs()
      const totalJobs = jobs.length
      const completedJobs = jobs.filter(job => job.status === 'COMPLETED').length
      const runningJobs = jobs.filter(job => job.status === 'RUNNING').length
      const failedJobs = jobs.filter(job => job.status === 'FAILED').length
      const totalEventsFound = jobs.reduce((sum, job) => sum + job.eventsFound, 0)

      const recentActivity = {
        jobsToday: jobs.filter(job => {
          const today = new Date()
          const jobDate = new Date(job.createdAt)
          return jobDate.toDateString() === today.toDateString()
        }).length,
        eventsToday: jobs.filter(job => {
          const today = new Date()
          const jobDate = new Date(job.createdAt)
          return jobDate.toDateString() === today.toDateString()
        }).reduce((sum, job) => sum + job.eventsFound, 0)
      }

      return {
        totalJobs,
        completedJobs,
        runningJobs,
        failedJobs,
        totalEventsFound,
        recentActivity,
        successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0
      }
    })
})