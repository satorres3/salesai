import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { opportunitiesRepository } from '@/lib/csv-repository'
import { CreateOpportunitySchema } from '@/lib/types'

export const opportunitiesRouter = router({
  // Get all opportunities
  list: publicProcedure.query(async () => {
    return opportunitiesRepository.findAll()
  }),

  // Get opportunity by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const opportunity = await opportunitiesRepository.findById(input.id)
      if (!opportunity) throw new Error('Opportunity not found')
      return opportunity
    }),

  // Create new opportunity
  create: publicProcedure
    .input(CreateOpportunitySchema)
    .mutation(async ({ input }) => {
      return opportunitiesRepository.create(input)
    }),

  // Update opportunity
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: CreateOpportunitySchema.partial()
    }))
    .mutation(async ({ input }) => {
      const updated = await opportunitiesRepository.update(input.id, input.data)
      if (!updated) throw new Error('Opportunity not found')
      return updated
    }),

  // Delete opportunity
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await opportunitiesRepository.delete(input.id)
      if (!deleted) throw new Error('Opportunity not found')
      return { success: true }
    }),

  // Get opportunities by event
  byEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return opportunitiesRepository.findByEvent(input.eventId)
    }),

  // Get top opportunities
  topOpportunities: publicProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      return opportunitiesRepository.getTopOpportunities(input.limit)
    }),

  // Get opportunities statistics
  statistics: publicProcedure.query(async () => {
    return opportunitiesRepository.getStatistics()
  }),
})