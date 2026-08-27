'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const copy = translations[language].header;
  const pathname = usePathname();

  const navItems = [
    { label: copy.nav.home, href: '/' },
    { label: copy.nav.courses, href: '/Courses' },
    { label: copy.nav.tcfTef, href: '/TCFTEFPrep' },
    { label: copy.nav.pricing, href: '/Pricing' },
    { label: copy.nav.blog, href: '/Blog' },
    { label: copy.nav.about, href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={logo.src} alt="ICLP Logo" className="w-18 h-18 object-contain" />
            <span className="hidden sm:inline text-sm lg:text-base font-medium text-foreground leading-tight">
              International Center for
              <br />
              Language Proficiency
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{language}</span>
            </button>
            <Button variant="ghost" asChild>
              <Link href="/SignIn">{copy.signIn}</Link>
            </Button>
            <Button className="bg-accent hover:bg-accent/90" asChild>
              <Link href="/Pricing">{copy.getStarted}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-left py-2 px-4 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-muted text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language}</span>
                </button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/SignIn" onClick={() => setIsMenuOpen(false)}>
                    {copy.signIn}
                  </Link>
                </Button>
              </div>
              <Button className="bg-accent hover:bg-accent/90 w-full" asChild>
                <Link href="/Pricing" onClick={() => setIsMenuOpen(false)}>
                  {copy.getStarted}
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
