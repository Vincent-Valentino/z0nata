import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, BarChart3, LogOut, ChevronDown } from 'lucide-react'
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu, 
  MobileNavToggle, 
  NavbarLogo, 
  NavbarButton 
} from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useAuthInit } from '@/hooks/useAuthInit'

export const HomeNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  
  // Initialize auth store with mock data for development
  useAuthInit()
  
  // Get auth state from Zustand store
  const { isAuthenticated, user, logout } = useAuthStore()

  const navItems = [
    { name: "Home", link: "/" },
    { name: "Dokumentasi", link: "/dokumentasi" },
    { name: "Mock Test", link: "/mock-test" },
    { name: "Time Quiz", link: "/time-quiz" },
  ]

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    console.log('Logging out...')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleResultsClick = () => {
    navigate('/results')
  }

  const getUserInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        {({ visible }: { visible?: boolean }) => (
          <>
            <Link to="/">
              <NavbarLogo visible={visible} />
            </Link>
            <NavItems items={navItems} />
            <div className="flex items-center gap-4 px-2 py-4">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 z-[70]">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.full_name.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[70]">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResultsClick}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      <span>Results</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <NavbarButton 
                    variant="primary" 
                    as="div"
                    visible={visible}
                    compactText="Sign In"
                  >
                    Log into Account
                  </NavbarButton>
                </Link>
              )}
            </div>
          </>
        )}
      </NavBody>
      
      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <Link to="/">
            <NavbarLogo />
          </Link>
          <MobileNavToggle 
            isOpen={isMobileMenuOpen} 
            onClick={handleMobileMenuToggle} 
          />
        </MobileNavHeader>
        
        <MobileNavMenu 
          isOpen={isMobileMenuOpen} 
          onClose={handleMobileMenuClose}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              to={item.link}
              className="relative font-roboto font-medium hover:text-emerald-600 transition-colors duration-200"
              onClick={handleMobileMenuClose}
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex w-full flex-col gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium">
                        {getUserInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start w-full px-0 py-2 h-auto font-roboto font-medium hover:text-emerald-600 transition-colors duration-200"
                      onClick={() => {
                        handleProfileClick()
                        handleMobileMenuClose()
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="justify-start w-full px-0 py-2 h-auto font-roboto font-medium hover:text-emerald-600 transition-colors duration-200"
                      onClick={() => {
                        handleResultsClick()
                        handleMobileMenuClose()
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Results
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="justify-start w-full px-0 py-2 h-auto font-roboto font-medium hover:text-red-600 transition-colors duration-200 text-red-600 dark:text-red-400"
                      onClick={() => {
                        handleLogout()
                        handleMobileMenuClose()
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login">
                <NavbarButton
                  onClick={handleMobileMenuClose}
                  variant="primary"
                  className="w-full"
                  as="div"
                >
                  Log into Account
                </NavbarButton>
              </Link>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
} 