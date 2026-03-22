import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Button } from '../components/ui/button';
import {
  Building2,
  Shield,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  BarChart3,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultRoute, isAuthenticated } from '../lib/auth';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    __amitDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const glassPanelClass =
  'relative overflow-hidden rounded-[2rem] border border-[#d4a808]/18 bg-white/[0.045] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)]';

const goldButtonClass =
  'h-14 px-8 text-lg border-0 bg-[linear-gradient(135deg,#b8920a_0%,#f5d442_45%,#d4a808_100%)] text-black shadow-[0_12px_32px_rgba(212,168,8,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(212,168,8,0.34)]';

const darkButtonClass =
  'h-14 px-8 text-lg border border-[#d4a808]/25 bg-white/[0.04] text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f5d442]/45 hover:bg-white/[0.08]';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [init, setInit] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 200]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!prefersReducedMotion) {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      }).then(() => {
        setInit(true);
      });
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
    setInstallPrompt(window.__amitDeferredInstallPrompt ?? null);

    const handlePendingPrompt = () => {
      setInstallPrompt(window.__amitDeferredInstallPrompt ?? null);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('amit:beforeinstallprompt', handlePendingPrompt);
    window.addEventListener('amit:appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('amit:beforeinstallprompt', handlePendingPrompt);
      window.removeEventListener('amit:appinstalled', handleInstalled);
    };
  }, []);

  const particlesLoaded = useCallback(async (_container: any) => {}, []);

  const [heroRef, heroInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [trustRef, trustInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2, triggerOnce: true });

  const handleLoginClick = () => {
    if (isAuthenticated()) {
      router.push(getDefaultRoute());
    } else {
      router.push('/login');
    }
  };

  const handleSupervisionReportClick = () => {
    window.open('https://amit-ex.vercel.app/', '_blank');
  };

  const handleGardenersManagementClick = () => {
    window.open('https://amit-gardens.vercel.app/', '_blank');
  };

  const handleInstallClick = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        window.__amitDeferredInstallPrompt = null;
      }

      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIos = /iphone|ipad|ipod/.test(ua);

    if (isIos) {
      toast('להתקנת האפליקציה ב-iPhone פתחו את תפריט השיתוף ובחרו "Add to Home Screen".');
      return;
    }

    if (isAndroid) {
      toast('בדפדפן הזה אפשר להוסיף למסך הבית. ב-Chrome תופיע גם אפשרות התקנה מלאה כשהדפדפן מאפשר זאת.');
      return;
    }

    toast('כדי להתקין את האפליקציה, פתחו את האתר בדפדפן Chrome או Edge במכשיר נייד.');
  };

  if (!mounted) return null;

  const fadeInUp = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

  const staggerContainer = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
      };

  const scaleIn = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : { hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } } };

  const features = [
    {
      icon: Building2,
      title: 'ניהול נכסים חכם',
      description: 'ניהול מקיף של כל הנכסים במקום אחד עם מעקב בזמן אמת',
    },
    {
      icon: Users,
      title: 'ממשק משתמש מתקדם',
      description: 'חוויית משתמש אינטואיטיבית המותאמת לכל סוגי המשתמשים',
    },
    {
      icon: Shield,
      title: 'אבטחה מתקדמת',
      description: 'הגנה מרבית על המידע עם הצפנה מתקדמת ובקרת גישה',
    },
    {
      icon: Zap,
      title: 'ביצועים מהירים',
      description: 'מערכת מהירה ויעילה המבוססת על טכנולוגיות עדכניות',
    },
  ];

  const proofPoints = [
    { number: '500+', label: 'לקוחות פעילים' },
    { number: '10,000+', label: 'יחידות מנוהלות' },
    { number: '99.9%', label: 'זמינות מערכת' },
    { number: '24/7', label: 'תמיכה טכנית' },
  ];

  const trustSignals = [
    {
      icon: CheckCircle2,
      title: 'אמינות תפעולית',
      description: 'מערכת יציבה עם 99.9% זמינות, גיבוי אוטומטי ותיעוד מלא של כל פעולה.',
    },
    {
      icon: Lock,
      title: 'אבטחה ובקרה',
      description: 'הצפנה מתקדמת, הרשאות לפי תפקיד ומעקב ביקורת מלא על כל גישה.',
    },
    {
      icon: BarChart3,
      title: 'זרימות עבודה לפי תפקיד',
      description: 'כל משתמש רואה את המידע והפעולות הרלוונטיים לתפקידו — בלי עומס מיותר.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060606] text-white" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,212,66,0.18),transparent_34%),radial-gradient(circle_at_18%_28%,rgba(255,240,191,0.1),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(212,168,8,0.12),transparent_22%),linear-gradient(180deg,#111111_0%,#060606_52%,#0a0a0a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),transparent_28%,rgba(212,168,8,0.06)_50%,transparent_72%)] opacity-70" />

      {/* Particles — desktop only, respects reduced-motion */}
      {init && !isMobile && !prefersReducedMotion && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          className="absolute inset-0 z-0"
          options={{
            background: { color: { value: 'transparent' } },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: { enable: false, mode: 'push' },
                onHover: { enable: false, mode: 'repulse' },
                resize: { enable: true },
              },
            },
            particles: {
              color: { value: '#f5d442' },
              links: {
                color: '#d4a808',
                distance: 150,
                enable: true,
                opacity: 0.12,
                width: 1,
              },
              collisions: { enable: false },
              move: {
                direction: 'none',
                enable: true,
                outModes: { default: 'bounce' },
                random: false,
                speed: 0.4,
                straight: false,
              },
              number: {
                density: { enable: true, width: 800, height: 800 },
                value: 32,
              },
              opacity: { value: 0.2 },
              shape: { type: 'circle' },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Subtle floating elements — desktop only */}
      {!prefersReducedMotion && !isMobile && (
        <>
          <motion.div
            style={{ y: y1 }}
            className="absolute left-10 top-20 h-24 w-24 rounded-full bg-[#f5d442]/10 blur-3xl"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-20 right-10 h-36 w-36 rounded-full bg-[#d4a808]/8 blur-3xl"
          />
        </>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a808]/20 bg-white/[0.04] px-4 py-2 text-sm text-[#fff0bf] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <Shield className="h-4 w-4 text-[#f5d442]" />
                מעטפת ניהול יוקרתית לאחזקה, תפעול ובקרה
              </div>
            </motion.div>

            {/* Logo */}
            <motion.div variants={scaleIn} className="mx-auto mb-8">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(245,212,66,0.24),rgba(212,168,8,0.06),rgba(255,217,102,0.24))] blur-2xl"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[#ffe599]/40 bg-[linear-gradient(135deg,#111111_0%,#1a1a1a_100%)] shadow-[0_20px_48px_rgba(0,0,0,0.45)]">
                  <Building2 className="relative z-10 h-12 w-12 text-[#f5d442]" />
                </div>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold leading-tight sm:text-5xl md:text-7xl bg-[linear-gradient(135deg,#ffffff_0%,#fff0bf_34%,#f5d442_68%,#ffffff_100%)] bg-clip-text text-transparent"
            >
              עמית אקסלנס אחזקות
            </motion.h1>

            {/* Static subtitle — replaces TypeAnimation for better first-screen clarity */}
            <motion.p
              variants={fadeInUp}
              className="mb-8 text-lg text-[#e8e4d8] sm:text-xl md:text-2xl"
            >
              ניהול תפעולי מקצועי לבניינים, דיירים וצוותי שטח
            </motion.p>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-[#bfb7a5] sm:text-lg md:text-xl"
            >
              מערכת ניהול אחזקות מתקדמת המשלבת טכנולוגיות חדשניות לניהול יעיל ומקצועי של נכסים ואחזקה
            </motion.p>

            {/* Proof points — above the fold */}
            <motion.div
              variants={fadeInUp}
              className="mx-auto grid max-w-4xl gap-3 pt-2 grid-cols-2 sm:gap-4 md:grid-cols-4"
            >
              {proofPoints.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#d4a808]/14 bg-white/[0.03] px-4 py-3 text-center backdrop-blur-md sm:px-5 sm:py-4"
                >
                  <div className="mb-1 bg-[linear-gradient(135deg,#fff0bf_0%,#f5d442_55%,#d4a808_100%)] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                    {stat.number}
                  </div>
                  <div className="text-xs text-[#bfb7a5] sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Primary CTA */}
            <motion.div variants={fadeInUp} className="flex items-center justify-center pt-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={handleLoginClick}
                  size="lg"
                  className={`${goldButtonClass} group`}
                >
                  כניסה למערכת ניהול
                  <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Button>

                <Button
                  onClick={handleSupervisionReportClick}
                  size="lg"
                  className={`${darkButtonClass} group`}
                >
                  מעבר לדו״ח פיקוח
                  <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Button>

                <Button
                  onClick={handleGardenersManagementClick}
                  size="lg"
                  className={`${darkButtonClass} group`}
                >
                  מעבר לניהול גננים
                  <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Button>

                {!isStandalone ? (
                  <Button
                    onClick={() => void handleInstallClick()}
                    size="lg"
                    className={`${darkButtonClass} group`}
                  >
                    הורד אפליקציה
                    <Download className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                  </Button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Signals Section — appears before features */}
      <section ref={trustRef} className="relative z-10 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate={trustInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-12 text-center sm:mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-2xl font-bold text-[#fff8e6] sm:mb-6 sm:text-3xl md:text-4xl"
            >
              בנוי לארגונים שדורשים שליטה ושקיפות
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-base text-[#bfb7a5] sm:text-lg"
            >
              אבטחה, אמינות וביצועים מוכחים — לא רק עיצוב יפה
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={trustInView ? 'visible' : 'hidden'}
            className="grid gap-6 sm:gap-8 md:grid-cols-3"
          >
            {trustSignals.map((signal, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`${glassPanelClass} p-6 sm:p-8`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d4a808_0%,#f5d442_100%)] text-black shadow-[0_10px_24px_rgba(212,168,8,0.22)]">
                  <signal.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#fff8e6] sm:text-xl">
                  {signal.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#bfb7a5] sm:text-base">
                  {signal.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-10 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-12 text-center sm:mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 bg-[linear-gradient(135deg,#ffffff_0%,#ffe599_45%,#d4a808_100%)] bg-clip-text text-2xl font-bold text-transparent sm:mb-6 sm:text-3xl md:text-5xl"
            >
              למה לבחור בנו?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-3xl text-base text-[#c2bcaf] sm:text-xl"
            >
              פתרון מקיף ומתקדם שמשלב טכנולוגיה חדשנית עם ניסיון עשיר בתחום
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`${glassPanelClass} p-6 transition-all duration-300 hover:border-[#f5d442]/35 hover:shadow-[0_24px_60px_rgba(212,168,8,0.12)]`}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d4a808_0%,#f5d442_100%)] text-black shadow-[0_10px_24px_rgba(212,168,8,0.22)]">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,217,102,0.7),transparent)]" />
                <h3 className="mb-3 text-center text-lg font-semibold text-[#fff8e6] sm:text-xl">
                  {feature.title}
                </h3>
                <p className="text-center text-sm leading-relaxed text-[#bfb7a5] sm:text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.8 }}
            viewport={{ once: true }}
            className={`${glassPanelClass} p-8 md:p-12`}
          >
            <h2 className="mb-4 bg-[linear-gradient(135deg,#ffffff_0%,#fff0bf_40%,#f5d442_100%)] bg-clip-text text-2xl font-bold text-transparent sm:mb-6 sm:text-3xl md:text-4xl">
              מוכנים להתחיל?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-base text-[#c8c1b1] sm:mb-8 sm:text-xl">
              הצטרפו לאלפי לקוחות מרוצים שכבר חווים את העתיד של ניהול אחזקות
            </p>
            <Button
              onClick={handleLoginClick}
              size="lg"
              className="h-14 border-0 bg-[linear-gradient(135deg,#b8920a_0%,#f5d442_45%,#d4a808_100%)] px-10 text-lg text-black shadow-[0_16px_40px_rgba(212,168,8,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(212,168,8,0.38)] sm:h-16 sm:px-12 sm:text-xl"
            >
              התחילו עכשיו
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
