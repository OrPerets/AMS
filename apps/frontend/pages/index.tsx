// /Users/orperetz/Documents/AMS/apps/frontend/pages/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { useInView } from 'react-intersection-observer';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Button } from '../components/ui/button';
import { 
  Building2, 
  Shield, 
  Users, 
  Zap, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getDefaultRoute, isAuthenticated } from '../lib/auth';

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

const scaleIn = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

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
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 200]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    setMounted(true);
    
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (_container: any) => {
  }, []);

  const [heroRef, heroInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.3, triggerOnce: true });

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
    window.open("https://amit-gardens.vercel.app/", '_blank');
  };

  if (!mounted) return null;

  const features = [
    {
      icon: Building2,
      title: "ניהול נכסים חכם",
      description: "ניהול מקיף של כל הנכסים במקום אחד עם מעקב בזמן אמת"
    },
    {
      icon: Users,
      title: "ממשק משתמש מתקדם",
      description: "חוויית משתמש אינטואיטיבית המותאמת לכל סוגי המשתמשים"
    },
    {
      icon: Shield,
      title: "אבטחה מתקדמת",
      description: "הגנה מרבית על המידע עם הצפנה מתקדמת ובקרת גישה"
    },
    {
      icon: Zap,
      title: "ביצועים מהירים",
      description: "מערכת מהירה ויעילה המבוססת על טכנולוגיות עדכניות"
    }
  ];

  const stats = [
    { number: "500+", label: "לקוחות מרוצים" },
    { number: "10,000+", label: "יחידות מנוהלות" },
    { number: "99.9%", label: "זמינות מערכת" },
    { number: "24/7", label: "תמיכה טכנית" }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060606] text-white" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,212,66,0.18),transparent_34%),radial-gradient(circle_at_18%_28%,rgba(255,240,191,0.1),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(212,168,8,0.12),transparent_22%),linear-gradient(180deg,#111111_0%,#060606_52%,#0a0a0a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),transparent_28%,rgba(212,168,8,0.06)_50%,transparent_72%)] opacity-70" />

      {/* Particles Background */}
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          className="absolute inset-0 z-0"
          options={{
            background: { color: { value: "transparent" } },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: true, mode: "repulse" },
                resize: { enable: true },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              color: { value: "#f5d442" },
              links: {
                color: "#d4a808",
                distance: 150,
                enable: true,
                opacity: 0.15,
                width: 1,
              },
              collisions: { enable: false },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 0.8,
                straight: false,
              },
              number: {
                density: { enable: true, width: 800, height: 800 },
                value: 64,
              },
              opacity: { value: 0.28 },
              shape: { type: "circle" },
              size: {
                value: { min: 1, max: 4 },
              },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Floating elements */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute left-10 top-20 h-24 w-24 rounded-full bg-[#f5d442]/14 blur-3xl"
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-20 right-10 h-36 w-36 rounded-full bg-[#d4a808]/12 blur-3xl"
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a808]/20 bg-white/[0.04] px-4 py-2 text-sm text-[#fff0bf] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <Sparkles className="h-4 w-4 text-[#f5d442]" />
                מעטפת ניהול יוקרתית לאחזקה, תפעול ובקרה
              </div>
            </motion.div>

            {/* Logo */}
            <motion.div variants={scaleIn} className="mx-auto mb-8">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(245,212,66,0.24),rgba(212,168,8,0.06),rgba(255,217,102,0.24))] blur-2xl"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div 
                  className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[#ffe599]/40 bg-[linear-gradient(135deg,#111111_0%,#1a1a1a_100%)] shadow-[0_20px_48px_rgba(0,0,0,0.45)]"
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(120deg,transparent_0%,rgba(255,217,102,0.26)_48%,transparent_100%)]"
                    animate={{ x: ['-120%', '120%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <Building2 className="relative z-10 h-12 w-12 text-[#f5d442]" />
                </motion.div>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={fadeInUp}
              className="mb-6 text-5xl font-bold leading-tight md:text-7xl bg-[linear-gradient(135deg,#ffffff_0%,#fff0bf_34%,#f5d442_68%,#ffffff_100%)] bg-clip-text text-transparent"
            >
              עמית אקסלנס אחזקות
            </motion.h1>

            {/* Animated Subtitle */}
            <motion.div variants={fadeInUp} className="mb-8 h-16 text-xl text-[#f3f2ef] md:text-2xl">
              <TypeAnimation
                sequence={[
                  'מערכת לניהול אחזקות מתקדמת',
                  2000,
                  'פתרון חכם לניהול נכסים',
                  2000,
                  'טכנולוגיה מתקדמת למקצוענים',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                className="inline-block"
              />
            </motion.div>

            {/* Description */}
            <motion.p 
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-[#d6d1c5] md:text-xl"
            >
              מערכת ניהול אחזקות מתקדמת המשלבת טכנולוגיות חדשניות לניהול יעיל ומקצועי של נכסים ואחזקה
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleLoginClick}
                    size="lg" 
                    className={`${goldButtonClass} group`}
                  >
                    כניסה למערכת ניהול
                    <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSupervisionReportClick}
                    size="lg"
                    className={`${darkButtonClass} group`}
                  >
                    מעבר לדו״ח פיקוח
                    <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleGardenersManagementClick}
                    size="lg"
                    className={`${darkButtonClass} group`}
                  >
                    מעבר לניהול גננים
                    <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mx-auto grid max-w-5xl gap-4 pt-6 md:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#d4a808]/14 bg-white/[0.03] px-5 py-4 text-center backdrop-blur-md"
                >
                  <div className="mb-1 bg-[linear-gradient(135deg,#fff0bf_0%,#f5d442_55%,#d4a808_100%)] bg-clip-text text-3xl font-bold text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-[#bfb7a5] md:text-base">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              variants={fadeInUp}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex h-10 w-6 justify-center rounded-full border-2 border-[#f5d442]/30"
              >
                <motion.div className="mt-2 h-3 w-1 rounded-full bg-[#f5d442]" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="mb-6 bg-[linear-gradient(135deg,#ffffff_0%,#ffe599_45%,#d4a808_100%)] bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
            >
              למה לבחור בנו?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="mx-auto max-w-3xl text-xl text-[#c2bcaf]"
            >
              פתרון מקיף ומתקדם שמשלב טכנולוגיה חדשנית עם ניסיון עשיר בתחום
            </motion.p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -10 }}
                className={`${glassPanelClass} p-6 transition-all duration-300 hover:border-[#f5d442]/35 hover:shadow-[0_24px_60px_rgba(212,168,8,0.12)]`}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d4a808_0%,#f5d442_100%)] text-black shadow-[0_10px_24px_rgba(212,168,8,0.22)]">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,217,102,0.7),transparent)]" />
                <h3 className="mb-3 text-center text-xl font-semibold text-[#fff8e6]">{feature.title}</h3>
                <p className="text-center leading-relaxed text-[#bfb7a5]">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className={`${glassPanelClass} p-8 md:p-12`}
          >
            <motion.div
              className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,212,66,0.85),transparent)]"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.h2 
              variants={fadeInUp}
              className="mb-12 bg-[linear-gradient(135deg,#ffffff_0%,#ffe599_55%,#d4a808_100%)] bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl"
            >
              המספרים מדברים בעד עצמם
            </motion.h2>
            
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="rounded-2xl border border-white/6 bg-black/20 px-4 py-6 text-center"
                >
                  <div className="mb-2 bg-[linear-gradient(135deg,#fff9e6_0%,#f5d442_52%,#b8920a_100%)] bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                    {stat.number}
                  </div>
                  <div className="text-sm text-[#bfb7a5] md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={`${glassPanelClass} p-8 md:p-12`}
          >
            <motion.div
              className="absolute -right-16 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-[#d4a808]/10 blur-3xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="mb-6 bg-[linear-gradient(135deg,#ffffff_0%,#fff0bf_40%,#f5d442_100%)] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              מוכנים להתחיל?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-[#c8c1b1]">
              הצטרפו לאלפי לקוחות מרוצים שכבר חווים את העתיד של ניהול אחזקות
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleLoginClick}
                size="lg"
                className="h-16 border-0 bg-[linear-gradient(135deg,#b8920a_0%,#f5d442_45%,#d4a808_100%)] px-12 text-xl text-black shadow-[0_16px_40px_rgba(212,168,8,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(212,168,8,0.38)]"
              >
                התחילו עכשיו
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
