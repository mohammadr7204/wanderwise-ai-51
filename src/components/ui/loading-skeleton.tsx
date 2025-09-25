import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface LoadingSkeletonProps {
  className?: string
  type?: 'card' | 'restaurant' | 'accommodation' | 'activity'
  count?: number
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  )
}

export function LoadingRestaurant({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

export function LoadingActivity({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border-l-4 border-l-primary/20 bg-muted/30 p-4 space-y-2", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function LoadingSkeleton({ 
  className, 
  type = 'card', 
  count = 3 
}: LoadingSkeletonProps) {
  const components = Array.from({ length: count }, (_, i) => {
    switch (type) {
      case 'restaurant':
        return <LoadingRestaurant key={i} className={className} />
      case 'accommodation':
        return <LoadingCard key={i} className={className} />
      case 'activity':
        return <LoadingActivity key={i} className={className} />
      default:
        return <LoadingCard key={i} className={className} />
    }
  })

  return <div className="space-y-4">{components}</div>
}

export { LoadingCard, LoadingRestaurant, LoadingActivity }