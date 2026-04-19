'use client';

import { useEffect } from 'react';
import { Link } from '@/navigation';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Heart, Shield, Users, Sparkles, ArrowRight, Crown, Eye, Zap,
  MapPin, Filter, ChevronDown, Star, Check, X, Clock, Globe,
  Calendar, MessageCircle, Lock, Smartphone, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { trackCommercialEvent } from '@/lib/commercial-events';
import PlansComparison from './plans-comparison';
import TestimonialsSection from './testimonials-section';
import FAQSection from './faq-section';
import { useTranslations } from 'next-intl';

interface LandingPageProps {
  data: {
    sections: Record<string, any>;
    sectionsList: any[];
    faqs: any[];
    testimonials: any[];
    settings: Record<string, string>;
    plans: any[];
    defaultContent: any;
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    if (inView) controls.start('visible');
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage({ data }: LandingPageProps) {
  const t = useTranslations('Landing');
  const common = useTranslations('Common');
  const { sections, faqs, testimonials, settings, plans, defaultContent } = data;

  // Registrar visita na landing
  useEffect(() => {
    trackCommercialEvent({ eventType: 'landing_visit' });
  }, []);

  const handleCtaClick = (location: string) => {
    trackCommercialEvent({ eventType: 'cta_click', metadata: { location } });
  };

  const getContent = (sectionKey: string, field: string, defaultValue: any) => {
    const section = sections[sectionKey];
    if (section?.content && typeof section.content === 'object' && field in section.content) {
      return section.content[field];
    }
    if (section && field in section) {
      return section[field];
    }
    const dc = defaultContent[sectionKey];
    return dc ? dc[field] : defaultValue;
  };

  const hero = defaultContent.hero;
  const valueProposition = defaultContent.valueProposition;
  const everNow = defaultContent.everNow;
  const compatibility = defaultContent.compatibility;
  const filters = defaultContent.filters;
  const realMeetings = defaultContent.realMeetings;
  const privacy = defaultContent.privacy;
  const passport = defaultContent.passport;
  const scheduledPassport = defaultContent.scheduledPassport;
  const premiumBenefits = defaultContent.premiumBenefits;
  const finalCta = defaultContent.finalCta;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ever</span>
              <span className="text-neutral-900 dark:text-white">NOW</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" onClick={() => handleCtaClick('header')}>
              <Button variant="ghost" className="hidden sm:inline-flex">{t('login')}</Button>
            </Link>
            <Link href="/cadastro" onClick={() => handleCtaClick('header')}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/25">
                {t('signup')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
              <Sparkles className="h-4 w-4 mr-2" />
              {settings.hero_badge || hero.subtitle}
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-neutral-900 dark:text-white">
                {settings.hero_title ? settings.hero_title.split(' ').slice(0, -2).join(' ') : t('title').split(' ').slice(0, -2).join(' ')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {settings.hero_title ? settings.hero_title.split(' ').slice(-2).join(' ') : t('title').split(' ').slice(-2).join(' ')}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10">
              {settings.hero_description || t('subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cadastro" onClick={() => handleCtaClick('hero-primary')}>
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-600/25 rounded-full">
                  {settings.hero_cta_primary || t('cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" onClick={() => handleCtaClick('hero-secondary')}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-2">
                  {settings.hero_cta_secondary || t('login')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: '500K+', label: common('profiles') },
              { value: '2M+', label: common('connections') },
              { value: '4.8★', label: common('rating') }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-neutral-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {settings.value_title || t('why_title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {settings.value_subtitle || t('why_subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProposition.items.map((item: any, i: number) => {
              const iconMap: Record<string, LucideIcon> = { Heart, Shield, Users, Zap };
              const Icon = iconMap[item.icon] || Heart;
              return (
                <motion.div key={i} variants={fadeInUp}>
                  <Card className="p-6 h-full bg-neutral-50 dark:bg-neutral-800 border-0 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">{item.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">{item.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatedSection>
      </section>

      {/* Ever + Now Concept */}
      <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('ever_now_title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('ever_now_subtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ever */}
            <motion.div variants={fadeInUp}>
              <Card className="p-8 h-full bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="h-8 w-8" fill="white" />
                    <span className="text-3xl font-bold">{t('ever_title')}</span>
                  </div>
                  <p className="text-indigo-100 text-lg mb-2">{t('ever_tagline')}</p>
                  <p className="text-white/90 mb-6">{t('ever_desc')}</p>
                  <ul className="space-y-2">
                    {everNow.ever.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-indigo-200" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>

            {/* Now */}
            <motion.div variants={fadeInUp}>
              <Card className="p-8 h-full bg-gradient-to-br from-pink-500 to-purple-600 border-0 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-8 w-8" />
                    <span className="text-3xl font-bold">{t('now_title')}</span>
                  </div>
                  <p className="text-pink-100 text-lg mb-2">{t('now_tagline')}</p>
                  <p className="text-white/90 mb-6">{t('now_desc')}</p>
                  <ul className="space-y-2">
                    {everNow.now.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-pink-200" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          </div>
        </AnimatedSection>
      </section>

      {/* Compatibility */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                Algoritmo Inteligente
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                {t('deep_compatibility')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                {t('deep_compatibility_desc')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {compatibility.categories.map((cat: any, i: number) => {
                  const keys = ['personality', 'lifestyle', 'values', 'relationship'];
                  const key = keys[i];
                  const name = t(`${key}` as any);
                  return (
                    <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">{name || cat.name}</h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{cat.description}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <div className="aspect-square max-w-md mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl rotate-6 opacity-20" />
                <div className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-8 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">94%</div>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('avg_compatibility')}</p>
                  </div>
                  <div className="mt-8 space-y-3">
                    {['personality', 'values', 'interests', 'lifestyle'].map((key, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                            style={{ width: `${90 + (i * 2)}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-500 w-20">{t(`${key}` as any)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      </section>

      {/* Filters */}
      <section className="py-20 px-4 bg-neutral-50 dark:bg-neutral-950">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {filters.title}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {filters.description}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3">
            {filters.items.map((item: string, i: number) => (
              <div key={i} className="px-5 py-3 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
              </div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Real Meetings */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <AnimatedSection className="max-w-6xl mx-auto text-center text-white">
          <motion.div variants={fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{realMeetings.title}</h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">{realMeetings.description}</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid sm:grid-cols-3 gap-8">
            {realMeetings.stats.map((stat: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-2">{stat.value}</div>
                <p className="text-white/80">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Privacy */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {privacy.title}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {privacy.description}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {privacy.features.map((feature: any, i: number) => (
              <Card key={i} className="p-6 text-center border-0 bg-neutral-50 dark:bg-neutral-800">
                <Shield className="h-10 w-10 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </Card>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Passport */}
      <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                <Globe className="h-4 w-4 mr-2" />
                Recurso Premium
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                {t('passport_title')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
                {t('passport_desc')}
              </p>
              <ul className="space-y-3">
                {passport.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <Card className="p-6 bg-white dark:bg-neutral-800 border-0 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-blue-500" />
                  <span className="font-semibold text-neutral-900 dark:text-white">{t('active_trip')}</span>
                </div>
                <div className="space-y-3">
                  {['Paris, França', 'Nova York, EUA', 'Tóquio, Japão'].map((city, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <span className="text-neutral-700 dark:text-neutral-300">{city}</span>
                      <Badge variant="outline" className="border-blue-200 text-blue-600">
                        {12 + i * 5} {t('profiles_count')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </AnimatedSection>
      </section>

      {/* Scheduled Passport */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
              <Calendar className="h-4 w-4 mr-2" />
              Novo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {scheduledPassport.title}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {scheduledPassport.description}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-8">
            {scheduledPassport.howItWorks.map((step: any, i: number) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{step.description}</p>
              </div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Plans Comparison */}
      {plans.length > 0 && (
        <section className="py-20 px-4 bg-neutral-50 dark:bg-neutral-950">
          <AnimatedSection className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                {t('plan_title')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                {t('plan_subtitle')}
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <PlansComparison plans={plans} onPlanClick={handleCtaClick} />
            </motion.div>
          </AnimatedSection>
        </section>
      )}

      {/* Premium Benefits */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
              <Crown className="h-4 w-4 mr-2" />
              Premium
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {premiumBenefits.title}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {premiumBenefits.subtitle}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumBenefits.items.map((item: any, i: number) => {
              const premiumIconMap: Record<string, LucideIcon> = { Crown, Eye, Sparkles, Zap, MapPin, Filter };
              const Icon = premiumIconMap[item.icon] || Crown;
              return (
                <Card key={i} className="p-6 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-800">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-neutral-50 dark:bg-neutral-950">
        <AnimatedSection className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('real_stories')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('real_stories_subtitle')}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <TestimonialsSection testimonials={testimonials} />
          </motion.div>
        </AnimatedSection>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <AnimatedSection className="max-w-3xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('faq_title')}
            </h2>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FAQSection faqs={faqs} />
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {finalCta.title}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {finalCta.subtitle}
          </p>
          <Link href="/cadastro" onClick={() => handleCtaClick('final-cta')}>
            <Button size="lg" className="text-lg px-10 py-6 bg-white text-indigo-700 hover:bg-neutral-100 rounded-full shadow-2xl">
              {finalCta.button}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold">EverNOW</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-400">
              <Link href="/planos" className="hover:text-white transition-colors">{common('plans')}</Link>
              <Link href="/login" className="hover:text-white transition-colors">{t('login')}</Link>
              <Link href="/cadastro" className="hover:text-white transition-colors">{t('signup')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
            © 2026 EverNOW. {common('rights')}
          </div>
        </div>
      </footer>
    </div>
  );
}
