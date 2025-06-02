import { useState } from 'react'
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

export const HomeNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Home", link: "#home" },
    { name: "Courses", link: "#courses" },
    { name: "Student Test", link: "#student-test" },
    { name: "Kahoot", link: "#kahoot" },
  ]

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          <NavbarButton variant="primary" href="#login">
            Log into Account
          </NavbarButton>
        </div>
      </NavBody>
      
      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
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
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              className="relative text-neutral-600 dark:text-neutral-300 font-roboto font-medium hover:text-emerald-600 transition-colors duration-200"
              onClick={handleMobileMenuClose}
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full flex-col gap-4">
            <NavbarButton
              onClick={handleMobileMenuClose}
              variant="primary"
              className="w-full"
            >
              Log into Account
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
} 