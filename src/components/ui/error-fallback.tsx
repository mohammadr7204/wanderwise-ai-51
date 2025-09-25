import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Alert, AlertDescription } from "./alert"
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorFallbackProps {
  title?: string
  description?: string
  error?: Error | string
  onRetry?: () => void
  className?: string
  type?: 'network' | 'data' | 'general'
  showDetails?: boolean
}

export function ErrorFallback({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  error,
  onRetry,
  className,
  type = 'general',
  showDetails = false
}: ErrorFallbackProps) {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-8 w-8 text-destructive" />
      default:
        return <AlertCircle className="h-8 w-8 text-destructive" />
    }
  }

  const getTypeSpecificContent = () => {
    switch (type) {
      case 'network':
        return {
          title: "Connection Error",
          description: "Unable to connect to our servers. Please check your internet connection and try again.",
          suggestions: [
            "Check your internet connection",
            "Try refreshing the page",
            "If the problem persists, try again in a few minutes"
          ]
        }
      case 'data':
        return {
          title: "Data Loading Error",
          description: "We couldn't load the requested data. This might be temporary.",
          suggestions: [
            "Try refreshing the data",
            "Check if you have the required permissions",
            "Contact support if the problem continues"
          ]
        }
      default:
        return {
          title,
          description,
          suggestions: ["Try refreshing the page", "Contact support if the issue persists"]
        }
    }
  }

  const content = getTypeSpecificContent()
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <Card className={cn("max-w-md mx-auto", className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          {getIcon()}
        </div>
        <CardTitle className="text-lg">{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDetails && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-mono">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">What you can do:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {content.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Network status indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          You're currently offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    </div>
  )
}