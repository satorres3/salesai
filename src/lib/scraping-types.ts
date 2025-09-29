import { z } from 'zod'

export const ScrapingJobSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
  eventsFound: z.number().default(0),
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const ScrapedEventSchema = z.object({
  id: z.string(),
  scrapingJobId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  location: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().default('Switzerland'),
  topic: z.string().nullable(),
  organizer: z.string().nullable(),
  website: z.string().url().nullable(),
  rawData: z.record(z.any()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type ScrapingJob = z.infer<typeof ScrapingJobSchema>
export type ScrapedEvent = z.infer<typeof ScrapedEventSchema>

export type CreateScrapingJobInput = Omit<ScrapingJob, 'id' | 'createdAt' | 'updatedAt'>
export type CreateScrapedEventInput = Omit<ScrapedEvent, 'id' | 'createdAt' | 'updatedAt'>

export interface ScrapingService {
  startJob(url: string): Promise<string>
  getJobStatus(jobId: string): Promise<ScrapingJob | null>
  getJobEvents(jobId: string): Promise<ScrapedEvent[]>
  getAllJobs(): Promise<ScrapingJob[]>
  cancelJob(jobId: string): Promise<boolean>
}

export interface EventScraper {
  scrapeEventList(url: string): Promise<ScrapedEvent[]>
  scrapeEventDetails(eventUrl: string): Promise<Partial<ScrapedEvent>>
  canHandle(url: string): boolean
  getName(): string
}