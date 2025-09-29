import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'

// Initialize tRPC
const t = initTRPC.create({
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})

// Export reusable router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure