import { useState } from 'react'
import { useToast } from './use-toast'

interface ExportData {
  trip: any
  itinerary: any
}

export function useExportFeatures() {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const generatePDF = async (data: ExportData) => {
    setIsExporting(true)
    try {
      // Simulate PDF generation - in real app, use jsPDF or similar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create downloadable content
      const content = `
WanderWise AI Travel Itinerary
${data.trip.title}

Generated: ${new Date().toLocaleDateString()}

${JSON.stringify(data.itinerary.content, null, 2)}
      `
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.trip.title}-itinerary.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Generated",
        description: "Your itinerary has been downloaded successfully!"
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateCalendarFile = async (data: ExportData) => {
    setIsExporting(true)
    try {
      const activities = data.itinerary.content.dailyItinerary || []
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WanderWise//Travel Itinerary//EN',
        'CALSCALE:GREGORIAN'
      ]

      activities.forEach((day: any, index: number) => {
        const dayDate = new Date(data.trip.form_data.startDate)
        dayDate.setDate(dayDate.getDate() + index)
        
        const formatDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }

        if (day.morning) {
          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${Date.now()}-morning-${index}@wanderwise.ai`,
            `DTSTART:${formatDate(new Date(dayDate.getTime() + 9 * 60 * 60 * 1000))}`,
            `DTEND:${formatDate(new Date(dayDate.getTime() + 12 * 60 * 60 * 1000))}`,
            `SUMMARY:${day.morning.activity}`,
            `DESCRIPTION:${day.morning.venue || ''} - ${day.morning.cost || ''}`,
            `LOCATION:${day.morning.venue || data.itinerary.content.destination || ''}`,
            'END:VEVENT'
          )
        }

        if (day.afternoon) {
          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${Date.now()}-afternoon-${index}@wanderwise.ai`,
            `DTSTART:${formatDate(new Date(dayDate.getTime() + 14 * 60 * 60 * 1000))}`,
            `DTEND:${formatDate(new Date(dayDate.getTime() + 17 * 60 * 60 * 1000))}`,
            `SUMMARY:${day.afternoon.activity}`,
            `DESCRIPTION:${day.afternoon.venue || ''} - ${day.afternoon.cost || ''}`,
            `LOCATION:${day.afternoon.venue || data.itinerary.content.destination || ''}`,
            'END:VEVENT'
          )
        }

        if (day.evening) {
          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${Date.now()}-evening-${index}@wanderwise.ai`,
            `DTSTART:${formatDate(new Date(dayDate.getTime() + 19 * 60 * 60 * 1000))}`,
            `DTEND:${formatDate(new Date(dayDate.getTime() + 22 * 60 * 60 * 1000))}`,
            `SUMMARY:${day.evening.activity}`,
            `DESCRIPTION:${day.evening.venue || ''} - ${day.evening.cost || ''}`,
            `LOCATION:${day.evening.venue || data.itinerary.content.destination || ''}`,
            'END:VEVENT'
          )
        }
      })

      icsContent.push('END:VCALENDAR')

      const blob = new Blob([icsContent.join('\n')], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.trip.title}-calendar.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Calendar Exported",
        description: "Your itinerary events have been exported to your calendar!"
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to generate calendar file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const shareItinerary = async (tripId: string, tripTitle: string) => {
    const shareUrl = `${window.location.origin}/trip/${tripId}/itinerary?shared=true`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripTitle} Itinerary`,
          text: `Check out my travel itinerary for ${tripTitle}!`,
          url: shareUrl
        })
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link Copied",
          description: "Shareable link copied to clipboard!"
        })
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard!"
      })
    }
  }

  const inviteCollaborator = async (tripId: string, email: string) => {
    try {
      // In a real app, this would send an invitation email
      const inviteUrl = `${window.location.origin}/trip/${tripId}/collaborate?invite=${btoa(email)}`
      
      await navigator.clipboard.writeText(inviteUrl)
      toast({
        title: "Invitation Created",
        description: `Collaboration invite link copied to clipboard for ${email}`
      })
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: "Unable to create collaboration invite. Please try again.",
        variant: "destructive"
      })
    }
  }

  return {
    isExporting,
    generatePDF,
    generateCalendarFile,
    shareItinerary,
    inviteCollaborator
  }
}