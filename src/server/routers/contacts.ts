import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { contactsRepository } from '@/lib/csv-repository'
import { CreateContactSchema } from '@/lib/types'

export const contactsRouter = router({
  // Get all contacts
  list: publicProcedure.query(async () => {
    return contactsRepository.findAll()
  }),

  // Get contact by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const contact = await contactsRepository.findById(input.id)
      if (!contact) throw new Error('Contact not found')
      return contact
    }),

  // Create new contact
  create: publicProcedure
    .input(CreateContactSchema)
    .mutation(async ({ input }) => {
      return contactsRepository.create(input)
    }),

  // Update contact
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: CreateContactSchema.partial()
    }))
    .mutation(async ({ input }) => {
      const updated = await contactsRepository.update(input.id, input.data)
      if (!updated) throw new Error('Contact not found')
      return updated
    }),

  // Delete contact
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await contactsRepository.delete(input.id)
      if (!deleted) throw new Error('Contact not found')
      return { success: true }
    }),

  // Get contacts by event
  byEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return contactsRepository.findByEvent(input.eventId)
    }),

  // Get contacts statistics
  statistics: publicProcedure.query(async () => {
    return contactsRepository.getStatistics()
  }),
})