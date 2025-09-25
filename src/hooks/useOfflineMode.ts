import { useState, useEffect } from 'react'

interface OfflineData {
  trips: any[]
  itineraries: any[]
  lastSync: number
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline data on mount
    loadOfflineData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('wanderwise_offline_data')
      if (stored) {
        setOfflineData(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  const saveForOffline = (data: Partial<OfflineData>) => {
    try {
      const current = offlineData || { trips: [], itineraries: [], lastSync: 0 }
      const updated = {
        ...current,
        ...data,
        lastSync: Date.now()
      }
      
      localStorage.setItem('wanderwise_offline_data', JSON.stringify(updated))
      setOfflineData(updated)
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  const getOfflineTrip = (tripId: string) => {
    return offlineData?.trips.find(trip => trip.id === tripId)
  }

  const getOfflineItinerary = (tripId: string) => {
    return offlineData?.itineraries.find(itinerary => itinerary.trip_id === tripId)
  }

  const clearOfflineData = () => {
    localStorage.removeItem('wanderwise_offline_data')
    setOfflineData(null)
  }

  const hasOfflineData = () => {
    return offlineData && (offlineData.trips.length > 0 || offlineData.itineraries.length > 0)
  }

  const getLastSyncTime = () => {
    return offlineData?.lastSync ? new Date(offlineData.lastSync) : null
  }

  return {
    isOnline,
    offlineData,
    saveForOffline,
    getOfflineTrip,
    getOfflineItinerary,
    clearOfflineData,
    hasOfflineData,
    getLastSyncTime,
    loadOfflineData
  }
}