'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Star } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Header } from './../components/Header';
import { Footer } from './../components/Footer';
import Home  from './Home/page';
import  Courses  from './Courses/page';
import  TCFTEFPrep  from './TCFTEFPrep/page';
import  Pricing  from './Pricing/page';
import  Blog  from './Blog/page';
import  SignIn  from './SignIn/page';
import  SignUp  from './SignUp/page';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'courses':
        return <Courses />;
      case 'tcf-tef':
        return <TCFTEFPrep />;
      case 'pricing':
        return <Pricing onNavigate={handleNavigate} />;
      case 'blog':
        return <Blog />;
        case 'signin':
          return <SignIn onNavigate={handleNavigate} />;
        case 'signup':
          return <SignUp onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
