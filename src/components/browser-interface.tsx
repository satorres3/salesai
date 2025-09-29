'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc'
import Link from 'next/link'
import {
  Globe,
  Camera,
  MousePointer,
  Keyboard,
  RefreshCw,
  ArrowLeft,
  Plus,
  Save,
  Eye,
  Download,
  Home
} from 'lucide-react'

interface ExtractedEvent {
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  city: string
  country: string
  website: string
}

export function BrowserInterface() {
  const [currentUrl, setCurrentUrl] = useState('https://swiss-congress.ch')
  const [browserStatus, setBrowserStatus] = useState<'closed' | 'opening' | 'ready'>('closed')
  const [currentSnapshot, setCurrentSnapshot] = useState<string | null>(null)
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([])

  const utils = trpc.useUtils()

  // tRPC mutations and queries
  const navigateMutation = trpc.browser.navigate.useMutation({
    onSuccess: (data) => {
      setBrowserStatus('ready')
      console.log('Navigation success:', data.message)
    },
    onError: (error) => {
      setBrowserStatus('closed')
      console.error('Navigation failed:', error.message)
    }
  })

  const screenshotMutation = trpc.browser.takeScreenshot.useMutation({
    onSuccess: (data) => {
      setCurrentSnapshot(data.screenshotPath)
      console.log('Screenshot success:', data.message)
    },
    onError: (error) => {
      console.error('Screenshot failed:', error.message)
    }
  })

  const extractEventsMutation = trpc.browser.extractEvents.useMutation({
    onSuccess: (data) => {
      setExtractedEvents(data.events)
      console.log('Extract success:', data.message)
    },
    onError: (error) => {
      console.error('Extract failed:', error.message)
    }
  })

  const saveEventsMutation = trpc.browser.saveEvents.useMutation({
    onSuccess: (data) => {
      // Refresh dashboard data
      utils.events.list.invalidate()
      utils.dashboard.stats.invalidate()
      alert(`${data.message}`)
      setExtractedEvents([]) // Clear after saving
    },
    onError: (error) => {
      console.error('Save failed:', error.message)
      alert('Failed to save events: ' + error.message)
    }
  })

  // Browser control functions using real tRPC calls
  const handleNavigate = useCallback(async () => {
    if (!currentUrl.trim()) return

    setBrowserStatus('opening')
    try {
      await navigateMutation.mutateAsync({ url: currentUrl.trim() })
    } catch (error) {
      // Error handled by mutation
    }
  }, [currentUrl, navigateMutation])

  const handleTakeSnapshot = useCallback(async () => {
    try {
      await screenshotMutation.mutateAsync()
    } catch (error) {
      // Error handled by mutation
    }
  }, [screenshotMutation])

  const handleExtractEvents = useCallback(async () => {
    try {
      await extractEventsMutation.mutateAsync()
    } catch (error) {
      // Error handled by mutation
    }
  }, [extractEventsMutation])

  const handleSaveEvents = useCallback(async () => {
    if (extractedEvents.length === 0) return

    try {
      await saveEventsMutation.mutateAsync(extractedEvents)
    } catch (error) {
      // Error handled by mutation
    }
  }, [extractedEvents, saveEventsMutation])

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Universal Event Discovery</h1>
        <Link href="/">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Browser Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Universal Event Browser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter any event website URL..."
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleNavigate}
              disabled={navigateMutation.isPending || !currentUrl.trim()}
            >
              {navigateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Navigate
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={
              browserStatus === 'ready' ? 'default' :
              browserStatus === 'opening' ? 'secondary' : 'outline'
            }>
              {browserStatus === 'ready' ? 'Browser Ready' :
               browserStatus === 'opening' ? 'Opening Browser...' : 'Browser Closed'}
            </Badge>

            {browserStatus === 'ready' && (
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleTakeSnapshot}>
                  <Camera className="h-4 w-4 mr-1" />
                  Snapshot
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Browser View & Event Extraction */}
      {browserStatus === 'ready' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Browser Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Page View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                {currentSnapshot ? (
                  <img
                    src={currentSnapshot}
                    alt="Browser snapshot"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Take a snapshot to see the page</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleExtractEvents}
                  disabled={extractEventsMutation.isPending}
                  className="flex-1"
                >
                  {extractEventsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Extract Events from Page
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Extracted Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events extracted yet</p>
                  <p className="text-xs">Navigate to an event website and extract events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {extractedEvents.map((event, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">
                        📅 {event.startDate} - {event.endDate}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        📍 {event.location}, {event.city}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={handleSaveEvents}
                    disabled={saveEventsMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    {saveEventsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save {extractedEvents.length} Events to Database
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Universal Event Discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. <strong>Navigate:</strong> Enter any event website URL and click Navigate</p>
          <p>2. <strong>Explore:</strong> Use browser tools to find event listings on the site</p>
          <p>3. <strong>Extract:</strong> Click "Extract Events from Page" to automatically find events</p>
          <p>4. <strong>Review:</strong> Check extracted events for accuracy and completeness</p>
          <p>5. <strong>Save:</strong> Save valid events to your database (auto-filters for October 2025+)</p>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700 font-medium">✨ Works with ANY event website!</p>
            <p className="text-blue-600 text-xs">swiss-congress.ch, eventbrite.com, meetup.com, conferences.org, and more...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}