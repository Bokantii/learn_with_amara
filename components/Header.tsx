import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState('EN');

  const navItems = [
    { label: 'Home', page: 'home' },
    { label: 'Courses', page: 'courses' },
    { label: 'TCF/TEF Prep', page: 'tcf-tef' },
    { label: 'Pricing', page: 'pricing' },
    { label: 'Blog', page: 'blog' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'FR' : 'EN');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white">ICLP</span>
            </div>
            
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`transition-colors hover:text-primary ${
                  currentPage === item.page ? 'text-primary' : 'text-foreground'
                }`}
              >
                {item.label}
              </button>
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
            <Button
              variant="ghost"
              onClick={() => onNavigate('signin')}
            >
              Sign In
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={() => onNavigate('home')}
            >
              Get Started
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
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left py-2 px-4 rounded-lg transition-colors ${
                    currentPage === item.page
                      ? 'bg-muted text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language}</span>
                </button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onNavigate('signin');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              </div>
              <Button
                className="bg-accent hover:bg-accent/90 w-full"
                onClick={() => {
                  onNavigate('home');
                  setIsMenuOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
