import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          className
        )}
        {...props}
      >
        <div 
          className={cn(
            "h-full w-full overflow-auto",
            // Custom scrollbar styles
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
            // Webkit scrollbar styles for better browser support
            "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/40",
            "[&::-webkit-scrollbar-corner]:bg-transparent",
            // Firefox scrollbar
            "scrollbar-width-thin scrollbar-color-[theme(colors.muted.foreground/0.2)_transparent]"
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)

ScrollArea.displayName = "ScrollArea"

export { ScrollArea } 