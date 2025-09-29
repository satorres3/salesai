import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { eventsRepository } from '@/lib/csv-repository'
import { CreateEventSchema, EventSchema } from '@/lib/types'

export const eventsRouter = router({
  // Get all upcoming events (October 2025+)
  list: publicProcedure.query(async () => {
    return eventsRepository.findUpcomingEvents()
  }),

  // Get event by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const event = await eventsRepository.findById(input.id)
      if (!event) throw new Error('Event not found')
      return event
    }),

  // Create new event
  create: publicProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input }) => {
      return eventsRepository.create(input)
    }),

  // Update event
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: CreateEventSchema.partial()
    }))
    .mutation(async ({ input }) => {
      const updated = await eventsRepository.update(input.id, input.data)
      if (!updated) throw new Error('Event not found')
      return updated
    }),

  // Delete event
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await eventsRepository.delete(input.id)
      if (!deleted) throw new Error('Event not found')
      return { success: true }
    }),

  // Get upcoming events by country
  byCountry: publicProcedure
    .input(z.object({ country: z.string() }))
    .query(async ({ input }) => {
      const upcomingEvents = await eventsRepository.findUpcomingEvents()
      return upcomingEvents.filter(event => event.country?.toLowerCase() === input.country.toLowerCase())
    }),

  // Get events by date range (admin endpoint)
  byDateRange: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      includeAll: z.boolean().default(false)
    }))
    .query(async ({ input }) => {
      if (input.includeAll) {
        return eventsRepository.findAll()
      }
      return eventsRepository.findEventsByDateRange(input.startDate, input.endDate)
    }),

  // Get events statistics
  statistics: publicProcedure.query(async () => {
    return eventsRepository.getStatistics()
  }),

  // Find by source URL
  bySourceUrl: publicProcedure
    .input(z.object({ sourceUrl: z.string() }))
    .query(async ({ input }) => {
      return eventsRepository.findBySourceUrl(input.sourceUrl)
    }),
})