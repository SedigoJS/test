"use client"

import type React from "react"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  const NavLink = ({
    href,
    onClick,
    children,
  }: {
    href: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    children: React.ReactNode
  }) => (
    <a href={href} onClick={onClick} className="text-black hover:text-gray-900 hover:border-b-2 border-gray-600">
      {children}
    </a>
  )

  return (
    <header className="top-0 left-0 right-0 z-50 bg-transparent">
      <nav className="w-full mx-auto px-4 sm:px-6 lg:px-[6.5rem] py-4">
        <div className="flex justify-between items-center">
          <div className="hidden md:flex gap-12 space-x-8 pt-4 font-sans text-lg">
            <NavLink href="#" onClick={() => window.location.reload()}>
              Home
            </NavLink>
            <NavLink href="#">About Us</NavLink>
            <NavLink href="#">Services</NavLink>
            <NavLink
              href="#footer"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                scrollToSection("footer")
              }}
            >
              Contact Us
            </NavLink>
          </div>

          {/* Burger menu icon */}
          <button className="md:hidden text-black" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-2 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col space-y-4 px-4">
              <NavLink
                href="#"
                onClick={() => {
                  window.location.reload()
                  setIsMenuOpen(false)
                }}
              >
                Home
              </NavLink>
              <NavLink href="#" onClick={() => setIsMenuOpen(false)}>
                About Us
              </NavLink>
              <NavLink href="#" onClick={() => setIsMenuOpen(false)}>
                Services
              </NavLink>
              <NavLink
                href="#footer"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault()
                  scrollToSection("footer")
                }}
              >
                Contact Us
              </NavLink>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Nav