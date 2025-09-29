import { router } from './trpc'
import { eventsRouter } from './routers/events'
import { contactsRouter } from './routers/contacts'
import { opportunitiesRouter } from './routers/opportunities'
import { dashboardRouter } from './routers/dashboard'
import { scrapingRouter } from './routers/scraping'
import { browserRouter } from './routers/browser'

export const appRouter = router({
  events: eventsRouter,
  contacts: contactsRouter,
  opportunities: opportunitiesRouter,
  dashboard: dashboardRouter,
  scraping: scrapingRouter,
  browser: browserRouter,
})

export type AppRouter = typeof appRouter