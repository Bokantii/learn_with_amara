'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Instagram, Loader2, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import logo from '../assets/logo.png';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';
import { subscribeToNewsletterAction } from '../lib/newsletter';

const INSTAGRAM_URL = 'https://www.instagram.com/centerforlanguageproficiency/';
const CANADA_WHATSAPP_URL = 'https://wa.me/14372918783';
const NIGERIA_WHATSAPP_URL = 'https://wa.me/2348130408788';

type NewsletterState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; alreadySubscribed: boolean }
  | { status: 'error'; message: string };

export function Footer() {
  const { language } = useLanguage();
  const copy = translations[language].footer;
  const [email, setEmail] = useState('');
  const [state, setState] = useState<NewsletterState>({ status: 'idle' });

  const quickLinks = [
    { label: copy.quickLinks.about, href: '/about' },
    { label: copy.quickLinks.community, href: '/community' },
    { label: copy.quickLinks.terms, href: '/terms' },
    { label: copy.quickLinks.privacy, href: '/privacy' },
  ];

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const result = await subscribeToNewsletterAction({ email });
      if (result.serverError || result.validationErrors) {
        setState({ status: 'error', message: result.serverError ?? copy.newsletterError });
        return;
      }
      setState({ status: 'success', alreadySubscribed: !!result.data?.alreadySubscribed });
      setEmail('');
    } catch {
      setState({ status: 'error', message: copy.newsletterError });
    }
  };

  return (
    <footer className="bg-slate-50 border-t border-border mt-20">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo.src} alt="ICLP Logo" className="w-18 h-18 object-contain" />
            </div>
            <p className="text-muted-foreground">
              {copy.tagline}
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3>{copy.quickLinksHeading}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3>{copy.contactHeading}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>{copy.email}</p>
              <p>
                {copy.canadaContact}
                {' · '}
                <a href={CANADA_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  WhatsApp
                </a>
              </p>
              <p>
                {copy.nigeriaContact}
                {' · '}
                <a href={NIGERIA_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  WhatsApp
                </a>
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3>{copy.newsletterHeading}</h3>
            <p className="text-muted-foreground">
              {copy.newsletterDescription}
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  className="bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label={copy.newsletterInputLabel}
                  disabled={state.status === 'submitting'}
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 shrink-0"
                  disabled={state.status === 'submitting'}
                  aria-label={copy.newsletterSubmit}
                >
                  {state.status === 'submitting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {state.status === 'success' && (
                <p className="text-sm text-primary" role="status">
                  {state.alreadySubscribed ? copy.newsletterAlreadySubscribed : copy.newsletterSuccess}
                </p>
              )}
              {state.status === 'error' && (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-border">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} International Center for Language Proficiency (ICLP). {copy.rightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
