'use client';
import { useRef } from 'react';
import Link from 'next/link';
import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import { GraduationCap, Users, BadgeCheck } from 'lucide-react';
import { Button } from './ui/button';
import { CountUp } from './CountUp';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

const EASE = [0.22, 1, 0.36, 1] as const;

const textContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const textItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Hero() {
  const { language } = useLanguage();
  const copy = translations[language].hero;

  // Gentle parallax on the decorative blobs only; disabled for reduced motion.
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const blobUp = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -80]);
  const blobDown = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 80]);

  return (
    <MotionConfig reducedMotion="user">
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50"
    >
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            className="space-y-6 lg:space-y-8"
            variants={textContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={textItem} className="text-4xl lg:text-5xl xl:text-6xl tracking-tight">
              {copy.title}
            </motion.h1>
            <motion.p variants={textItem} className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
              {copy.subtitle}
            </motion.p>
            <motion.div variants={textItem} className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-lg px-8 py-6"
                asChild
              >
                <Link href="/Pricing">{copy.getStarted}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
                asChild
              >
                <Link href="/Courses">{copy.exploreCourses}</Link>
              </Button>
            </motion.div>
            <motion.div variants={textItem}>
              <Link
                href="/assessments/placement"
                className="inline-block text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
              >
                {copy.testLevel}
              </Link>
            </motion.div>
            <motion.ul variants={textItem} className="mt-2 grid list-none gap-px overflow-hidden rounded-2xl border border-sky-100 bg-sky-100/70 p-0 shadow-sm sm:grid-cols-3">
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">
                  <CountUp end={4} duration={1} className="text-lg font-semibold text-primary" /> {copy.tracks}
                </span>
              </li>
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">{copy.communityTagline}</span>
              </li>
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">{copy.examConfidence}</span>
              </li>
            </motion.ul>
          </motion.div>

          {/* Image */}
          <div className="relative">
            <motion.div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1653669487404-09c3617c2b6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcGVvcGxlJTIwbGVhcm5pbmclMjBvbmxpbmUlMjBsYXB0b3B8ZW58MXx8fHwxNzU5NzU4OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt={copy.imageAlt}
                className="w-full h-auto aspect-[4/3] object-cover"
              />
            </motion.div>
            {/* Floating Elements */}
            <motion.div
              style={{ y: blobUp }}
              className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-2xl opacity-20 blur-2xl"
            />
            <motion.div
              style={{ y: blobDown }}
              className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary rounded-2xl opacity-20 blur-2xl"
            />
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
