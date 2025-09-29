'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BrowserInterface } from '@/components/browser-interface'

export default function AdminPage() {
  const utils = trpc.useUtils()

  // Query hooks
  const { data: stats } = trpc.scraping.getStats.useQuery()
  const { data: recentJobs } = trpc.scraping.getRecentJobs.useQuery({ limit: 10 })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'RUNNING': return 'secondary'
      case 'PENDING': return 'outline'
      case 'FAILED': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Event Scraping Admin</h1>
        <p className="text-muted-foreground">
          Manage event scraping jobs for Swiss Congress and other sources
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEventsFound || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.runningJobs || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Universal Browser Interface */}
      <BrowserInterface />


      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scraping Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentJobs?.length ? (
            <p className="text-muted-foreground">No scraping jobs yet</p>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {job.eventsFound} events found
                    </div>
                  </div>

                  <div className="text-sm mb-2">
                    <strong>URL:</strong> {job.url}
                  </div>

                  {job.status === 'RUNNING' && (
                    <Progress value={50} className="w-full" />
                  )}

                  {job.status === 'FAILED' && job.errorMessage && (
                    <div className="text-sm text-red-600 mt-2">
                      <strong>Error:</strong> {job.errorMessage}
                    </div>
                  )}

                  {job.startTime && job.endTime && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Duration: {new Date(job.endTime).getTime() - new Date(job.startTime).getTime()}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}