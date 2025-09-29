'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc'
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  MapPin,
  RefreshCw,
  ExternalLink,
  Mail,
  LogOut,
  User,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend
}: {
  title: string
  value: string | number
  description?: string
  icon: any
  trend?: { value: number; label: string }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-xs text-green-500">
              +{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string) {
  const colors = {
    DISCOVERED: 'secondary',
    ANALYZED: 'default',
    CONTACTED: 'default',
    CLOSED: 'secondary',
    NEW: 'default',
    VERIFIED: 'default',
    QUALIFIED: 'secondary',
    PROPOSAL_SENT: 'secondary',
    CLOSED_WON: 'default',
    CLOSED_LOST: 'destructive'
  } as const
  return colors[status as keyof typeof colors] || 'default'
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery()
  const { data: topOpportunities, isLoading: opportunitiesLoading } = trpc.opportunities.topOpportunities.useQuery({ limit: 5 })
  const { data: recentEvents, isLoading: eventsLoading } = trpc.events.list.useQuery()
  const { data: scrapingStats, isLoading: scrapingStatsLoading } = trpc.scraping.getStats.useQuery()
  const { data: recentJobs, isLoading: jobsLoading } = trpc.scraping.getRecentJobs.useQuery({ limit: 5 })
  const { user, logout } = useAuth()

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">DACH Events Sales Portal</h2>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <User className="mr-2 h-4 w-4" />
            {user?.email}
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Link href="/admin">
            <Button size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Scrape Events
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats?.events.total || 0}
          description={`${stats?.events.discovered || 0} discovered, ${stats?.events.analyzed || 0} analyzed`}
          icon={Calendar}
          trend={{ value: stats?.recentActivity.newEvents || 0, label: "this week" }}
        />
        <StatCard
          title="Contacts"
          value={stats?.contacts.total || 0}
          description={`${stats?.contacts.verified || 0} verified contacts`}
          icon={Users}
          trend={{ value: stats?.recentActivity.newContacts || 0, label: "this week" }}
        />
        <StatCard
          title="Opportunities"
          value={stats?.opportunities.total || 0}
          description={`€${(stats?.opportunities.totalEstimatedValue || 0).toLocaleString()} total value`}
          icon={Target}
          trend={{ value: stats?.recentActivity.newOpportunities || 0, label: "this week" }}
        />
        <StatCard
          title="Scraping Jobs"
          value={scrapingStats?.totalJobs || 0}
          description={`${scrapingStats?.totalEventsFound || 0} events scraped`}
          icon={Globe}
          trend={{ value: scrapingStats?.recentActivity.jobsToday || 0, label: "today" }}
        />
      </div>

      {/* Scraping Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Success Rate"
          value={`${scrapingStats?.successRate || 0}%`}
          description="Completed scraping jobs"
          icon={CheckCircle}
        />
        <StatCard
          title="Running Jobs"
          value={scrapingStats?.runningJobs || 0}
          description="Currently scraping"
          icon={Clock}
        />
        <StatCard
          title="Events Today"
          value={scrapingStats?.recentActivity.eventsToday || 0}
          description="New events discovered"
          icon={Activity}
        />
        <StatCard
          title="Failed Jobs"
          value={scrapingStats?.failedJobs || 0}
          description="Scraping errors"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Opportunities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunitiesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topOpportunities?.length ? (
              <div className="space-y-4">
                {topOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {opportunity.eventName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {opportunity.eventName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.recommendedProduct || 'Product recommendation pending'}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant={getStatusColor(opportunity.status)}>
                            {opportunity.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Match: {opportunity.matchScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        €{(opportunity.estimatedValue || 0).toLocaleString()}
                      </p>
                      <Progress
                        value={opportunity.matchScore}
                        className="w-[60px] mt-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No opportunities found</p>
                <p className="text-xs">Start scraping events to discover opportunities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scraping Jobs */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Scraping Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentJobs?.length ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {new URL(job.url).hostname}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Globe className="h-3 w-3 mr-1" />
                          {job.eventsFound} events found
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            job.status === 'COMPLETED' ? 'default' :
                            job.status === 'RUNNING' ? 'secondary' :
                            job.status === 'FAILED' ? 'destructive' : 'outline'
                          } className="text-xs">
                            {job.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scraping jobs found</p>
                <p className="text-xs">Start a scraping job to see activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Scrape Events
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Extract Contacts
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              AI Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Email Campaign
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}