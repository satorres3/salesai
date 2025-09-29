import { z } from 'zod'

// Enums
export const EventStatus = {
  DISCOVERED: 'DISCOVERED',
  ANALYZED: 'ANALYZED',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED'
} as const

export const ContactStatus = {
  NEW: 'NEW',
  VERIFIED: 'VERIFIED',
  CONTACTED: 'CONTACTED',
  RESPONDED: 'RESPONDED',
  QUALIFIED: 'QUALIFIED',
  UNRESPONSIVE: 'UNRESPONSIVE'
} as const

export const OpportunityStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATING: 'NEGOTIATING',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
} as const

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const

export const JobStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const

// Zod schemas for validation
export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  startDate: z.string().nullable(), // ISO date string
  endDate: z.string().nullable(), // ISO date string
  location: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  industry: z.string().nullable(),
  eventType: z.string().nullable(),
  estimatedAttendees: z.number().nullable(),
  sourceUrl: z.string(),
  sourcePlatform: z.string().nullable(),
  logoUrl: z.string().nullable(),
  status: z.enum(['DISCOVERED', 'ANALYZED', 'CONTACTED', 'CLOSED']),
  scrapedAt: z.string(), // ISO date string
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

export const ContactSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  fullName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  position: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  twitterUrl: z.string().nullable(),
  verified: z.boolean(),
  status: z.enum(['NEW', 'VERIFIED', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'UNRESPONSIVE']),
  source: z.string().nullable(),
  eventId: z.string().nullable(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

export const OpportunitySchema = z.object({
  id: z.string(),
  eventName: z.string(),
  estimatedValue: z.number().nullable(),
  matchScore: z.number(), // 0-100
  recommendedProduct: z.string().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  notes: z.string().nullable(),
  followUpDate: z.string().nullable(), // ISO date string
  closedAt: z.string().nullable(), // ISO date string
  eventId: z.string(),
  contactId: z.string().nullable(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

export const AIAnalysisSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  analysis: z.string(), // JSON string
  confidence: z.number(), // 0-100
  tags: z.string(), // comma-separated tags
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

export const ScrapingJobSchema = z.object({
  id: z.string(),
  source: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  startedAt: z.string().nullable(), // ISO date string
  completedAt: z.string().nullable(), // ISO date string
  error: z.string().nullable(),
  results: z.string().nullable(), // JSON string
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

// TypeScript types derived from Zod schemas
export type Event = z.infer<typeof EventSchema>
export type Contact = z.infer<typeof ContactSchema>
export type Opportunity = z.infer<typeof OpportunitySchema>
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>
export type ScrapingJob = z.infer<typeof ScrapingJobSchema>

// Input types for creating new records (without id, createdAt, updatedAt)
export const CreateEventSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scrapedAt: true
}).partial({
  status: true
})

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial({
  verified: true,
  status: true
})

export const CreateOpportunitySchema = OpportunitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial({
  status: true,
  priority: true
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
export type CreateContactInput = z.infer<typeof CreateContactSchema>
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>

// Statistics types for dashboard
export interface DashboardStats {
  events: {
    total: number
    discovered: number
    analyzed: number
    contacted: number
    closed: number
    byCountry: Record<string, number>
  }
  contacts: {
    total: number
    verified: number
    contacted: number
    responded: number
    qualified: number
  }
  opportunities: {
    total: number
    new: number
    qualified: number
    proposalSent: number
    closedWon: number
    closedLost: number
    avgMatchScore: number
    totalEstimatedValue: number
  }
  recentActivity: {
    newEvents: number
    newContacts: number
    newOpportunities: number
  }
}