import fs from 'fs/promises'
import path from 'path'
import csv from 'csv-parser'
import * as createCsvWriter from 'csv-writer'
import { Readable } from 'stream'
import {
  Event,
  Contact,
  Opportunity,
  CreateEventInput,
  CreateContactInput,
  CreateOpportunityInput,
  EventSchema,
  ContactSchema,
  OpportunitySchema,
  DashboardStats
} from './types'

// Utility function to generate unique IDs
function generateId(): string {
  return 'id-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

// Generic CSV Repository class
export abstract class CSVRepository<T, CreateInput> {
  protected csvPath: string
  protected headers: string[]

  constructor(fileName: string, headers: string[]) {
    this.csvPath = path.join(process.cwd(), 'src', 'data', fileName)
    this.headers = headers
  }

  // Read all records from CSV
  async findAll(): Promise<T[]> {
    try {
      const fileContent = await fs.readFile(this.csvPath, 'utf-8')
      const results: any[] = []

      return new Promise((resolve, reject) => {
        const stream = Readable.from([fileContent])
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            const validatedResults = results.map(row => this.validateRow(row))
            resolve(validatedResults.filter(Boolean) as T[])
          })
          .on('error', reject)
      })
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, return empty array
        return []
      }
      throw error
    }
  }

  // Find record by ID
  async findById(id: string): Promise<T | null> {
    const records = await this.findAll()
    return records.find((record: any) => record.id === id) || null
  }

  // Create new record
  async create(input: CreateInput): Promise<T> {
    const records = await this.findAll()
    const newRecord = this.prepareNewRecord(input)
    records.push(newRecord as T)
    await this.writeAll(records)
    return newRecord as T
  }

  // Update existing record
  async update(id: string, updates: Partial<CreateInput>): Promise<T | null> {
    const records = await this.findAll()
    const index = records.findIndex((record: any) => record.id === id)

    if (index === -1) return null

    const updatedRecord = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    records[index] = updatedRecord as T
    await this.writeAll(records)
    return updatedRecord as T
  }

  // Delete record
  async delete(id: string): Promise<boolean> {
    const records = await this.findAll()
    const filteredRecords = records.filter((record: any) => record.id !== id)

    if (filteredRecords.length === records.length) return false

    await this.writeAll(filteredRecords)
    return true
  }

  // Write all records to CSV
  protected async writeAll(records: T[]): Promise<void> {
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: this.csvPath,
      header: this.headers.map(h => ({ id: h, title: h }))
    })

    await csvWriter.writeRecords(records)
  }

  // Abstract methods to be implemented by subclasses
  protected abstract validateRow(row: any): T | null
  protected abstract prepareNewRecord(input: CreateInput): T
}

// Events Repository
export class EventsRepository extends CSVRepository<Event, CreateEventInput> {
  constructor() {
    super('events.csv', [
      'id', 'name', 'description', 'website', 'startDate', 'endDate',
      'location', 'city', 'country', 'industry', 'eventType',
      'estimatedAttendees', 'sourceUrl', 'sourcePlatform', 'logoUrl',
      'status', 'scrapedAt', 'createdAt', 'updatedAt'
    ])
  }

  protected validateRow(row: any): Event | null {
    try {
      // Convert string numbers back to numbers where needed
      if (row.estimatedAttendees && typeof row.estimatedAttendees === 'string') {
        row.estimatedAttendees = row.estimatedAttendees ? parseInt(row.estimatedAttendees, 10) : null
      }

      return EventSchema.parse(row)
    } catch (error) {
      console.warn('Invalid event row:', row, error)
      return null
    }
  }

  protected prepareNewRecord(input: CreateEventInput): Event {
    const now = new Date().toISOString()
    return {
      id: generateId(),
      ...input,
      status: input.status || 'DISCOVERED',
      scrapedAt: now,
      createdAt: now,
      updatedAt: now
    } as Event
  }

  // Find events by source URL
  async findBySourceUrl(sourceUrl: string): Promise<Event | null> {
    const events = await this.findAll()
    return events.find(event => event.sourceUrl === sourceUrl) || null
  }

  // Find events by country
  async findByCountry(country: string): Promise<Event[]> {
    const events = await this.findAll()
    return events.filter(event => event.country?.toLowerCase() === country.toLowerCase())
  }

  // Find upcoming events (events that start today or in the future)
  async findUpcomingEvents(): Promise<Event[]> {
    const events = await this.findAll()
    const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

    return events.filter(event => {
      if (!event.startDate) return true // Include events without start date
      return event.startDate >= today
    })
  }

  // Find events by date range
  async findEventsByDateRange(startDate?: string, endDate?: string): Promise<Event[]> {
    const events = await this.findAll()

    return events.filter(event => {
      if (!event.startDate) return true // Include events without start date

      if (startDate && event.startDate < startDate) return false
      if (endDate && event.startDate > endDate) return false

      return true
    })
  }

  // Get statistics
  async getStatistics() {
    const events = await this.findAll()
    return {
      total: events.length,
      discovered: events.filter(e => e.status === 'DISCOVERED').length,
      analyzed: events.filter(e => e.status === 'ANALYZED').length,
      contacted: events.filter(e => e.status === 'CONTACTED').length,
      closed: events.filter(e => e.status === 'CLOSED').length,
      byCountry: events.reduce((acc, event) => {
        const country = event.country || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
}

// Contacts Repository
export class ContactsRepository extends CSVRepository<Contact, CreateContactInput> {
  constructor() {
    super('contacts.csv', [
      'id', 'firstName', 'lastName', 'fullName', 'email', 'phone',
      'company', 'position', 'linkedinUrl', 'twitterUrl', 'verified',
      'status', 'source', 'eventId', 'createdAt', 'updatedAt'
    ])
  }

  protected validateRow(row: any): Contact | null {
    try {
      // Convert string booleans back to boolean
      if (typeof row.verified === 'string') {
        row.verified = row.verified === 'true'
      }

      return ContactSchema.parse(row)
    } catch (error) {
      console.warn('Invalid contact row:', row, error)
      return null
    }
  }

  protected prepareNewRecord(input: CreateContactInput): Contact {
    const now = new Date().toISOString()
    return {
      id: generateId(),
      ...input,
      verified: input.verified || false,
      status: input.status || 'NEW',
      createdAt: now,
      updatedAt: now
    } as Contact
  }

  // Find contacts by event
  async findByEvent(eventId: string): Promise<Contact[]> {
    const contacts = await this.findAll()
    return contacts.filter(contact => contact.eventId === eventId)
  }

  // Get statistics
  async getStatistics() {
    const contacts = await this.findAll()
    return {
      total: contacts.length,
      verified: contacts.filter(c => c.verified).length,
      contacted: contacts.filter(c => c.status === 'CONTACTED').length,
      responded: contacts.filter(c => c.status === 'RESPONDED').length,
      qualified: contacts.filter(c => c.status === 'QUALIFIED').length
    }
  }
}

// Opportunities Repository
export class OpportunitiesRepository extends CSVRepository<Opportunity, CreateOpportunityInput> {
  constructor() {
    super('opportunities.csv', [
      'id', 'eventName', 'estimatedValue', 'matchScore', 'recommendedProduct',
      'status', 'priority', 'notes', 'followUpDate', 'closedAt',
      'eventId', 'contactId', 'createdAt', 'updatedAt'
    ])
  }

  protected validateRow(row: any): Opportunity | null {
    try {
      // Convert string numbers back to numbers
      if (row.estimatedValue && typeof row.estimatedValue === 'string') {
        row.estimatedValue = row.estimatedValue ? parseFloat(row.estimatedValue) : null
      }
      if (row.matchScore && typeof row.matchScore === 'string') {
        row.matchScore = parseFloat(row.matchScore)
      }

      return OpportunitySchema.parse(row)
    } catch (error) {
      console.warn('Invalid opportunity row:', row, error)
      return null
    }
  }

  protected prepareNewRecord(input: CreateOpportunityInput): Opportunity {
    const now = new Date().toISOString()
    return {
      id: generateId(),
      ...input,
      status: input.status || 'NEW',
      priority: input.priority || 'MEDIUM',
      createdAt: now,
      updatedAt: now
    } as Opportunity
  }

  // Find opportunities by event
  async findByEvent(eventId: string): Promise<Opportunity[]> {
    const opportunities = await this.findAll()
    return opportunities.filter(opp => opp.eventId === eventId)
  }

  // Get top opportunities by match score
  async getTopOpportunities(limit = 10): Promise<Opportunity[]> {
    const opportunities = await this.findAll()
    return opportunities
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  }

  // Get statistics
  async getStatistics() {
    const opportunities = await this.findAll()
    const totalEstimatedValue = opportunities.reduce((sum, opp) =>
      sum + (opp.estimatedValue || 0), 0)
    const avgMatchScore = opportunities.length > 0
      ? opportunities.reduce((sum, opp) => sum + opp.matchScore, 0) / opportunities.length
      : 0

    return {
      total: opportunities.length,
      new: opportunities.filter(o => o.status === 'NEW').length,
      qualified: opportunities.filter(o => o.status === 'QUALIFIED').length,
      proposalSent: opportunities.filter(o => o.status === 'PROPOSAL_SENT').length,
      closedWon: opportunities.filter(o => o.status === 'CLOSED_WON').length,
      closedLost: opportunities.filter(o => o.status === 'CLOSED_LOST').length,
      avgMatchScore,
      totalEstimatedValue
    }
  }
}

// Repository instances (singletons)
export const eventsRepository = new EventsRepository()
export const contactsRepository = new ContactsRepository()
export const opportunitiesRepository = new OpportunitiesRepository()

// Dashboard service for aggregating statistics
export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const [eventsStats, contactsStats, opportunitiesStats] = await Promise.all([
      eventsRepository.getStatistics(),
      contactsRepository.getStatistics(),
      opportunitiesRepository.getStatistics()
    ])

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const [allEvents, allContacts, allOpportunities] = await Promise.all([
      eventsRepository.findAll(),
      contactsRepository.findAll(),
      opportunitiesRepository.findAll()
    ])

    const recentEvents = allEvents.filter(e => new Date(e.createdAt) > yesterday)
    const recentContacts = allContacts.filter(c => new Date(c.createdAt) > yesterday)
    const recentOpportunities = allOpportunities.filter(o => new Date(o.createdAt) > yesterday)

    return {
      events: eventsStats,
      contacts: contactsStats,
      opportunities: opportunitiesStats,
      recentActivity: {
        newEvents: recentEvents.length,
        newContacts: recentContacts.length,
        newOpportunities: recentOpportunities.length
      }
    }
  }
}