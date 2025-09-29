import { ScrapingService, EventScraper, ScrapingJob, ScrapedEvent } from './scraping-types'
import { scrapingJobRepository, scrapedEventRepository } from './scraping-repository'
import { chromium } from 'playwright'

class SwissCongressScraper implements EventScraper {
  canHandle(url: string): boolean {
    return url.includes('swiss-congress.ch') || url.includes('swisscongress.ch')
  }

  getName(): string {
    return 'Swiss Congress Scraper'
  }

  async scrapeEventList(url: string): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      console.log(`Scraping Swiss Congress events from: ${url}`)
      await page.goto(url, { waitUntil: 'networkidle' })

      // Look for event listings on the page
      const events = await page.evaluate(() => {
        const eventElements = document.querySelectorAll('.event-item, .conference-item, .event, [class*="event"], article, .card')
        const scrapedEvents = []

        for (const element of eventElements) {
          try {
            // Extract event details
            const nameElement = element.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]')
            const name = nameElement?.textContent?.trim()

            if (!name) continue // Skip if no name found

            const descElement = element.querySelector('.description, .summary, p, .content, [class*="desc"]')
            const description = descElement?.textContent?.trim() || null

            const linkElement = element.querySelector('a') || element.closest('a')
            const eventUrl = linkElement?.href || null

            // Extract date information
            const dateElement = element.querySelector('.date, .when, [class*="date"], time, [datetime]')
            let startDate = null
            let endDate = null

            if (dateElement) {
              const dateText = dateElement.textContent?.trim()
              const dateAttr = dateElement.getAttribute('datetime')

              // Try to parse dates (basic implementation)
              if (dateAttr) {
                startDate = dateAttr
              } else if (dateText) {
                // Basic date parsing - could be enhanced
                const dateMatch = dateText.match(/(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4}|\d{4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2})/)
                if (dateMatch) {
                  try {
                    const parsedDate = new Date(dateMatch[0].replace(/\./g, '/'))
                    if (!isNaN(parsedDate.getTime())) {
                      startDate = parsedDate.toISOString()
                    }
                  } catch (e) {
                    // Ignore date parsing errors
                  }
                }
              }
            }

            // Extract location
            const locationElement = element.querySelector('.location, .venue, .where, [class*="location"], [class*="venue"]')
            const location = locationElement?.textContent?.trim() || null

            // Extract city (try to guess from location or default to Swiss cities)
            let city = 'Zurich' // Default
            let country = 'Switzerland'

            if (location) {
              const locationLower = location.toLowerCase()
              if (locationLower.includes('zurich')) city = 'Zurich'
              else if (locationLower.includes('geneva')) city = 'Geneva'
              else if (locationLower.includes('basel')) city = 'Basel'
              else if (locationLower.includes('bern')) city = 'Bern'
              else if (locationLower.includes('lausanne')) city = 'Lausanne'
              else if (locationLower.includes('lucerne')) city = 'Lucerne'
            }

            scrapedEvents.push({
              name,
              description,
              url: eventUrl,
              startDate,
              endDate,
              location,
              city,
              country,
              topic: null, // Could be enhanced with topic extraction
              organizer: 'Swiss Congress', // Default organizer
              website: eventUrl,
              rawData: {
                source: 'swiss-congress',
                scrapedAt: new Date().toISOString(),
                originalUrl: window.location.href,
                element: element.outerHTML.substring(0, 500) // Store partial HTML for debugging
              }
            })
          } catch (error) {
            console.warn('Error processing event element:', error)
          }
        }

        return scrapedEvents
      })

      console.log(`Found ${events.length} events on Swiss Congress`)

      // Filter events for October 2025 onwards (current date is Sept 29, 2025)
      const currentDate = new Date('2025-10-01') // Start from October 1, 2025
      const futureEvents = events.filter(event => {
        if (!event.startDate) return true // Include events without dates for manual review

        try {
          const eventDate = new Date(event.startDate)
          return eventDate >= currentDate
        } catch {
          return true // Include events with unparseable dates for manual review
        }
      })

      console.log(`Filtered to ${futureEvents.length} future events (October 2025+)`)

      return futureEvents.map(event => ({
        ...event,
        scrapingJobId: '', // Will be set by the calling function
      })) as ScrapedEvent[]

    } catch (error) {
      console.error('Error scraping Swiss Congress:', error)
      throw error
    } finally {
      await browser.close()
    }
  }

  async scrapeEventDetails(eventUrl: string): Promise<Partial<ScrapedEvent>> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      console.log(`Scraping event details from: ${eventUrl}`)
      await page.goto(eventUrl, { waitUntil: 'networkidle' })

      // Extract detailed event information
      const eventDetails = await page.evaluate(() => {
        // Look for more detailed description
        const descElement = document.querySelector('.event-description, .full-description, .content, .body, [class*="description"], main p')
        const description = descElement?.textContent?.trim() || null

        // Look for organizer information
        const organizerElement = document.querySelector('.organizer, .by, .contact, [class*="organizer"], [class*="contact"]')
        const organizer = organizerElement?.textContent?.trim() || null

        // Look for more detailed location information
        const locationElement = document.querySelector('.venue, .address, .location-details, [class*="venue"], [class*="address"]')
        const location = locationElement?.textContent?.trim() || null

        // Look for topic/category information
        const topicElement = document.querySelector('.category, .topic, .tags, [class*="category"], [class*="topic"]')
        const topic = topicElement?.textContent?.trim() || null

        return {
          description,
          organizer,
          location,
          topic,
          rawData: {
            source: 'swiss-congress',
            scrapedAt: new Date().toISOString(),
            detailsUrl: window.location.href,
            fullHtml: document.body.innerHTML.substring(0, 2000) // Store partial HTML for debugging
          }
        }
      })

      return eventDetails

    } catch (error) {
      console.error('Error scraping event details:', error)
      return {
        rawData: {
          source: 'swiss-congress',
          scrapedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    } finally {
      await browser.close()
    }
  }
}

class ConferenceScraper implements EventScraper {
  canHandle(url: string): boolean {
    // Only handle URLs that contain conference/congress/summit but are NOT Swiss Congress
    return (url.includes('conference') || url.includes('congress') || url.includes('summit')) &&
           !url.includes('swiss-congress.ch') && !url.includes('swisscongress.ch')
  }

  getName(): string {
    return 'Generic Conference Scraper'
  }

  async scrapeEventList(url: string): Promise<ScrapedEvent[]> {
    // Return empty for now - we're focusing on Swiss Congress only
    console.log('Generic conference scraping disabled - focusing on Swiss Congress only')
    return []
  }

  async scrapeEventDetails(eventUrl: string): Promise<Partial<ScrapedEvent>> {
    return {
      rawData: { source: 'generic', scrapedAt: new Date().toISOString() }
    }
  }
}

export class ScrapingServiceImpl implements ScrapingService {
  private scrapers: EventScraper[] = [
    // Disabled automated scrapers - using MCP Playwright approach instead
    // new SwissCongressScraper(),
    // new ConferenceScraper()
  ]

  async startJob(url: string): Promise<string> {
    const job = await scrapingJobRepository.create({
      url,
      status: 'PENDING',
      startTime: null,
      endTime: null,
      eventsFound: 0,
      errorMessage: null
    })

    // Disabled automated scraping - will use MCP Playwright manually in admin interface
    await scrapingJobRepository.updateStatus(job.id, 'COMPLETED', {
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      eventsFound: 0,
      errorMessage: 'Automated scraping disabled - use MCP Playwright browser interface instead'
    })

    return job.id
  }

  private async performScraping(jobId: string, url: string): Promise<void> {
    try {
      await scrapingJobRepository.updateStatus(jobId, 'RUNNING', {
        startTime: new Date().toISOString()
      })

      const scraper = this.scrapers.find(s => s.canHandle(url))
      if (!scraper) {
        await scrapingJobRepository.updateStatus(jobId, 'FAILED', {
          endTime: new Date().toISOString(),
          errorMessage: 'No suitable scraper found for this URL'
        })
        return
      }

      const events = await scraper.scrapeEventList(url)

      for (const event of events) {
        await scrapedEventRepository.create({
          ...event,
          scrapingJobId: jobId
        })
      }

      await scrapingJobRepository.updateStatus(jobId, 'COMPLETED', {
        endTime: new Date().toISOString(),
        eventsFound: events.length
      })

    } catch (error) {
      await scrapingJobRepository.updateStatus(jobId, 'FAILED', {
        endTime: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async getJobStatus(jobId: string): Promise<ScrapingJob | null> {
    return scrapingJobRepository.findById(jobId)
  }

  async getJobEvents(jobId: string): Promise<ScrapedEvent[]> {
    return scrapedEventRepository.findByJobId(jobId)
  }

  async getAllJobs(): Promise<ScrapingJob[]> {
    return scrapingJobRepository.findAll()
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await scrapingJobRepository.findById(jobId)
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') {
      return false
    }

    await scrapingJobRepository.updateStatus(jobId, 'FAILED', {
      endTime: new Date().toISOString(),
      errorMessage: 'Job cancelled by user'
    })

    return true
  }
}

export const scrapingService = new ScrapingServiceImpl()