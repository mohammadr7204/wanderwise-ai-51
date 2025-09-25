import * as React from "react"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileOptimizedTabsProps {
  children: React.ReactNode
  defaultValue?: string
  className?: string
}

interface MobileTabsListProps {
  children: React.ReactNode
  className?: string
}

interface MobileTabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

interface MobileTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const MobileTabsContext = React.createContext<{
  activeTab: string
  setActiveTab: (value: string) => void
}>({
  activeTab: '',
  setActiveTab: () => {}
})

export function MobileOptimizedTabs({ 
  children, 
  defaultValue = '',
  className 
}: MobileOptimizedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue)

  return (
    <MobileTabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </MobileTabsContext.Provider>
  )
}

export function MobileTabsList({ children, className }: MobileTabsListProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { activeTab } = React.useContext(MobileTabsContext)

  // Desktop view - horizontal scrollable tabs
  const DesktopTabs = () => (
    <div className="hidden md:block">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className={cn(
          "inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}>
          {children}
        </div>
      </ScrollArea>
    </div>
  )

  // Mobile view - dropdown sheet
  const MobileTabs = () => {
    const activeTabLabel = React.Children.toArray(children).find((child: any) => 
      React.isValidElement(child) && child.props.value === activeTab
    )

    return (
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {React.isValidElement(activeTabLabel) && activeTabLabel.props.icon}
                {React.isValidElement(activeTabLabel) ? activeTabLabel.props.children : 'Select Tab'}
              </span>
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[50vh]">
            <div className="grid gap-2 py-4">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child, {
                    ...child.props,
                    className: cn(child.props.className, "w-full justify-start"),
                    onClick: () => {
                      child.props.onClick?.()
                      setIsOpen(false)
                    }
                  })
                }
                return child
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <>
      <DesktopTabs />
      <MobileTabs />
    </>
  )
}

export function MobileTabsTrigger({ 
  value, 
  children, 
  className,
  icon,
  ...props 
}: MobileTabsTriggerProps) {
  const { activeTab, setActiveTab } = React.useContext(MobileTabsContext)
  const isActive = activeTab === value

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  )
}

export function MobileTabsContent({ 
  value, 
  children, 
  className 
}: MobileTabsContentProps) {
  const { activeTab } = React.useContext(MobileTabsContext)

  if (activeTab !== value) return null

  return (
    <div className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  )
}