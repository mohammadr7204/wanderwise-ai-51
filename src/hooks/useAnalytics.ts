import { useEffect } from 'react'
import { useAuth } from './useAuth'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: number
}

export function useAnalytics() {
  const { user } = useAuth()

  // Track page views
  useEffect(() => {
    trackPageView(window.location.pathname)
  }, [])

  const track = (event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      userId: user?.id,
      timestamp: Date.now()
    }

    // Store locally for now - in production, send to analytics service
    const existingEvents = JSON.parse(localStorage.getItem('wanderwise_analytics') || '[]')
    existingEvents.push(analyticsEvent)
    
    // Keep only last 1000 events
    if (existingEvents.length > 1000) {
      existingEvents.splice(0, existingEvents.length - 1000)
    }
    
    localStorage.setItem('wanderwise_analytics', JSON.stringify(existingEvents))

    console.log('Analytics Event:', analyticsEvent)
  }

  const trackPageView = (path: string) => {
    track('page_view', { path })
  }

  const trackItineraryGenerated = (tripId: string, tier: string, duration: number) => {
    track('itinerary_generated', {
      tripId,
      tier,
      generation_duration_ms: duration
    })
  }

  const trackRecommendationClicked = (type: 'accommodation' | 'restaurant' | 'activity', name: string, url?: string) => {
    track('recommendation_clicked', {
      recommendation_type: type,
      recommendation_name: name,
      external_url: url
    })
  }

  const trackBookingAttempt = (type: 'accommodation' | 'restaurant' | 'flight', platform: string, tripId: string) => {
    track('booking_attempt', {
      booking_type: type,
      platform,
      tripId
    })
  }

  const trackItineraryModified = (tripId: string, modification_type: string) => {
    track('itinerary_modified', {
      tripId,
      modification_type
    })
  }

  const trackExportAction = (tripId: string, export_type: 'pdf' | 'calendar' | 'share') => {
    track('export_action', {
      tripId,
      export_type
    })
  }

  const trackUserFeedback = (tripId: string, rating: number, feedback?: string) => {
    track('user_feedback', {
      tripId,
      rating,
      feedback
    })
  }

  const trackFeatureUsage = (feature: string, context?: Record<string, any>) => {
    track('feature_usage', {
      feature,
      ...context
    })
  }

  const trackError = (error: string, context?: Record<string, any>) => {
    track('error_occurred', {
      error_message: error,
      ...context
    })
  }

  const getAnalyticsData = () => {
    return JSON.parse(localStorage.getItem('wanderwise_analytics') || '[]')
  }

  const clearAnalyticsData = () => {
    localStorage.removeItem('wanderwise_analytics')
  }

  return {
    track,
    trackPageView,
    trackItineraryGenerated,
    trackRecommendationClicked,
    trackBookingAttempt,
    trackItineraryModified,
    trackExportAction,
    trackUserFeedback,
    trackFeatureUsage,
    trackError,
    getAnalyticsData,
    clearAnalyticsData
  }
}
