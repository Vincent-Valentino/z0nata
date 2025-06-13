import { type ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip = ({ children, content, position = 'top' }: TooltipProps) => {
  return (
    <div className="relative group">
      {children}
      <div className={`absolute z-50 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
        position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' :
        position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' :
        position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-1' :
        'left-full top-1/2 transform -translate-y-1/2 ml-1'
      }`}>
        {content}
      </div>
    </div>
  )
} 