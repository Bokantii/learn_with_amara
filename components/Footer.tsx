'use client';

import { Facebook, Twitter, Linkedin, Youtube, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import logo from '../assets/logo.png';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';
interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { language } = useLanguage();
  const copy = translations[language].footer;

  const quickLinks = [
    { label: copy.quickLinks.about, page: 'home' },
    { label: copy.quickLinks.community, page: 'home' },
    { label: copy.quickLinks.terms, page: 'home' },
    { label: copy.quickLinks.privacy, page: 'home' },
  ];

  return (
    <footer className="bg-slate-50 border-t border-border mt-20">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white">ICLP</span>
              </div> */}
                <img src={logo.src} alt="ICLP Logo" className="w-18 h-18 object-contain" />
            </div>
            <p className="text-muted-foreground">
              {copy.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3>{copy.quickLinksHeading}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3>{copy.contactHeading}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>{copy.email}</p>
              <p>{copy.phone}</p>
              <p>{copy.supportHours}</p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3>{copy.newsletterHeading}</h3>
            <p className="text-muted-foreground">
              {copy.newsletterDescription}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={copy.emailPlaceholder}
                className="bg-white"
              />
              <Button className="bg-primary hover:bg-primary/90 shrink-0">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-border">
          <p className="text-muted-foreground">
            {copy.copyright}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
