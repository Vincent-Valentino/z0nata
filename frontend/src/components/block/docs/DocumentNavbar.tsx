import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Monitor, Menu, X, Search } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DocumentNavbarProps {
  onSearchOpen?: () => void
}

export const DocumentNavbar = ({ onSearchOpen }: DocumentNavbarProps) => {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'light':
        return <Sun className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85",
        "border-b border-border/60",
        isScrolled && "shadow-sm bg-background/98 border-border"
      )}
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-700/50 group-hover:shadow-xl transition-all duration-200">
                <span className="text-white font-bold text-xl font-roboto-condensed tracking-tight">Z</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xl text-foreground font-roboto-condensed tracking-wide">z0nata</div>
                <div className="text-xs text-muted-foreground -mt-1">
                  AI Documentation
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSearchOpen}
              className="relative justify-start text-sm min-w-[170px] px-4 text-muted-foreground hover:text-foreground bg-background/50 border-border/50 hover:bg-muted/50 hover:border-border transition-all shadow-sm hover:shadow-md"
            >
              <Search className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="hidden lg:inline-flex flex-1 text-left">Search...</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 lg:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-foreground hover:text-primary hover:bg-muted/50">
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-foreground hover:text-primary hover:bg-muted/50">
                <Link to="/mock-test">Mock Test</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-foreground hover:text-primary hover:bg-muted/50">
                <Link to="/time-quiz">Time Quiz</Link>
              </Button>
            </nav>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-muted/50">
                  <ThemeIcon />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border-border/50">
                <DropdownMenuItem onClick={() => setTheme('light')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Sun className="w-4 h-4 mr-2" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Moon className="w-4 h-4 mr-2" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Monitor className="w-4 h-4 mr-2" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-muted/50">
                  <ThemeIcon />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border-border/50">
                <DropdownMenuItem onClick={() => setTheme('light')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Sun className="w-4 h-4 mr-2" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Moon className="w-4 h-4 mr-2" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="text-foreground hover:bg-muted/50 focus:bg-muted/50">
                  <Monitor className="w-4 h-4 mr-2" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary hover:bg-muted/50"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 py-4 bg-background/50 backdrop-blur-sm">
            <div className="space-y-4">
              {/* Mobile Search */}
              <Button
                variant="outline"
                className="w-full justify-start bg-background/50 border-border/50 text-foreground hover:bg-muted/50 hover:text-foreground shadow-sm hover:shadow-md"
                onClick={() => {
                  onSearchOpen?.()
                  setIsMobileMenuOpen(false)
                }}
              >
                <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="flex-1 text-left">Search documentation...</span>
              </Button>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className="justify-start text-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/">Home</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/mock-test">Mock Test</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/time-quiz">Time Quiz</Link>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 