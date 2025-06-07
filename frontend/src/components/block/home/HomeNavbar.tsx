import { useState } from 'react'
import { Link } from 'react-router-dom'
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
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
} 