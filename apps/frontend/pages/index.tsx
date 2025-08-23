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
  ArrowRight
} from 'lucide-react';
import { getDefaultRoute, isAuthenticated } from '../lib/auth';

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
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
    transition: { duration: 0.5, ease: "backOut" }
  }
};

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
  }, [router]);

  const particlesLoaded = useCallback(async (container: any) => {
    console.log('Particles loaded', container);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden relative">
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
                resize: true,
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              color: { value: "#ffffff" },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
              },
              collisions: { enable: true },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 80,
              },
              opacity: { value: 0.3 },
              shape: { type: "circle" },
              size: {
                value: { min: 1, max: 5 },
              },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Floating elements */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"
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
            {/* Logo */}
            <motion.div variants={scaleIn} className="mx-auto mb-8">
              <div className="relative">
                <motion.div 
                  className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Building2 className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div 
                  className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl opacity-20 blur-xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6"
            >
              עמית אקסלנס אחזקות
            </motion.h1>

            {/* Animated Subtitle */}
            <motion.div variants={fadeInUp} className="text-xl md:text-2xl text-gray-300 mb-8 h-16">
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
              className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              מערכת ניהול אחזקות מתקדמת המשלבת טכנולוגיות חדשניות לניהול יעיל ומקצועי של נכסים ואחזקה
            </motion.p>

            {/* CTA Button */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleLoginClick}
                  size="lg" 
                  className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-xl group"
                >
                  כניסה למערכת
                  <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              variants={fadeInUp}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
              >
                <motion.div className="w-1 h-3 bg-white rounded-full mt-2" />
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
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              למה לבחור בנו?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-400 max-w-3xl mx-auto"
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
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-400/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-400 text-center leading-relaxed">{feature.description}</p>
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
            className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
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
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
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
            className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              מוכנים להתחיל?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              הצטרפו לאלפי לקוחות מרוצים שכבר חווים את העתיד של ניהול אחזקות
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleLoginClick}
                size="lg"
                className="h-16 px-12 text-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-2xl"
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
