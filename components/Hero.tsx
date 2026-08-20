'use client';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import Amara from './../assets/amara1.jpeg';
import { CountUp } from './CountUp';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';
interface HeroProps {
  onNavigate: (page: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const { language } = useLanguage();
  const copy = translations[language].hero;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6 lg:space-y-8">
            {/* <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-tight">
              Learn with Amara, Your Language Coach.
            </h1> */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-tight">
              {copy.title}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
              {copy.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-lg px-8 py-6"
                onClick={() => onNavigate('home')}
              >
                {copy.getStarted}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
                onClick={() => onNavigate('courses')}
              >
                {copy.exploreCourses}
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="space-y-1">
                <div className="text-3xl text-primary">
                  <CountUp end={50} suffix="K+" />
                </div>
                <div className="text-sm text-muted-foreground">{copy.activeLearners}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl text-primary">2</div>
                <div className="text-sm text-muted-foreground">{copy.tracks}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl text-primary">95%</div>
                <div className="text-sm text-muted-foreground">{copy.successRate}</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                // src={Amara.src}
                src="https://images.unsplash.com/photo-1653669487404-09c3617c2b6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcGVvcGxlJTIwbGVhcm5pbmclMjBvbmxpbmUlMjBsYXB0b3B8ZW58MXx8fHwxNzU5NzU4OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt={copy.imageAlt}
                className="w-full h-auto aspect-[4/3] object-cover"
                // className="w-full h-auto aspect-[4/3] object-cover"
              />
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-2xl opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary rounded-2xl opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
