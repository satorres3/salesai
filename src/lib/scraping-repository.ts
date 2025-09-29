import path from 'path'
import { CSVRepository } from './csv-repository'
import {
  ScrapingJob,
  ScrapedEvent,
  CreateScrapingJobInput,
  CreateScrapedEventInput,
  ScrapingJobSchema,
  ScrapedEventSchema
} from './scraping-types'

class ScrapingJobRepository extends CSVRepository<ScrapingJob, CreateScrapingJobInput> {
  constructor() {
    super(
      'scraping-jobs.csv',
      ['id', 'url', 'status', 'startTime', 'endTime', 'eventsFound', 'errorMessage', 'createdAt', 'updatedAt']
    )
  }

  protected validateRow(row: any): ScrapingJob | null {
    try {
      // Convert string numbers back to numbers where needed
      if (row.eventsFound && typeof row.eventsFound === 'string') {
        row.eventsFound = parseInt(row.eventsFound, 10)
      }

      // Convert empty strings to null for nullable datetime fields
      if (row.startTime === '') row.startTime = null
      if (row.endTime === '') row.endTime = null
      if (row.errorMessage === '') row.errorMessage = null

      return ScrapingJobSchema.parse(row)
    } catch (error) {
      console.warn('Invalid scraping job row:', row, error)
      return null
    }
  }

  protected prepareNewRecord(input: CreateScrapingJobInput): ScrapingJob {
    const now = new Date().toISOString()
    return {
      ...input,
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: now,
      updatedAt: now
    }
  }

  async updateStatus(
    id: string,
    status: ScrapingJob['status'],
    updates: Partial<Pick<ScrapingJob, 'startTime' | 'endTime' | 'eventsFound' | 'errorMessage'>> = {}
  ): Promise<ScrapingJob | null> {
    const job = await this.findById(id)
    if (!job) return null

    const updatedJob: ScrapingJob = {
      ...job,
      status,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return this.update(id, updatedJob)
  }

  async findByStatus(status: ScrapingJob['status']): Promise<ScrapingJob[]> {
    const jobs = await this.findAll()
    return jobs.filter(job => job.status === status)
  }
}

class ScrapedEventRepository extends CSVRepository<ScrapedEvent, CreateScrapedEventInput> {
  constructor() {
    super(
      'scraped-events.csv',
      ['id', 'scrapingJobId', 'name', 'description', 'url', 'startDate', 'endDate', 'location', 'city', 'country', 'topic', 'organizer', 'website', 'rawData', 'createdAt', 'updatedAt']
    )
  }

  protected validateRow(row: any): ScrapedEvent | null {
    try {
      // Convert empty strings to null for nullable fields
      if (row.description === '') row.description = null
      if (row.startDate === '') row.startDate = null
      if (row.endDate === '') row.endDate = null
      if (row.location === '') row.location = null
      if (row.city === '') row.city = null
      if (row.topic === '') row.topic = null
      if (row.organizer === '') row.organizer = null
      if (row.website === '') row.website = null
      if (row.rawData === '') row.rawData = null

      return ScrapedEventSchema.parse(row)
    } catch (error) {
      console.warn('Invalid scraped event row:', row, error)
      return null
    }
  }

  protected prepareNewRecord(input: CreateScrapedEventInput): ScrapedEvent {
    const now = new Date().toISOString()
    return {
      ...input,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: now,
      updatedAt: now
    }
  }

  async findByJobId(scrapingJobId: string): Promise<ScrapedEvent[]> {
    const events = await this.findAll()
    return events.filter(event => event.scrapingJobId === scrapingJobId)
  }

  async findByCity(city: string): Promise<ScrapedEvent[]> {
    const events = await this.findAll()
    return events.filter(event =>
      event.city?.toLowerCase().includes(city.toLowerCase())
    )
  }

  async findByTopic(topic: string): Promise<ScrapedEvent[]> {
    const events = await this.findAll()
    return events.filter(event =>
      event.topic?.toLowerCase().includes(topic.toLowerCase()) ||
      event.name.toLowerCase().includes(topic.toLowerCase()) ||
      event.description?.toLowerCase().includes(topic.toLowerCase())
    )
  }
}

export const scrapingJobRepository = new ScrapingJobRepository()
export const scrapedEventRepository = new ScrapedEventRepository()