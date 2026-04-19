import { Suspense } from 'react';
import prisma from '@/lib/db';
import LandingPage from '@/components/landing/landing-page';
import { defaultContent, defaultFaqs, defaultTestimonials } from '@/lib/landing-content';

async function getLandingData() {
  try {
    // Buscar seções ativas
    const sections = await prisma.landingSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    // Buscar FAQs ativos
    const faqs = await prisma.landingFAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    // Buscar depoimentos ativos
    const testimonials = await prisma.landingTestimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    // Buscar configurações
    const settingsRaw = await prisma.landingSetting.findMany();
    const settings: Record<string, string> = {};
    settingsRaw.forEach(s => {
      settings[s.key] = s.value;
    });

    // Buscar planos para comparação dinâmica
    const plans = await prisma.plan.findMany({
      where: {
        status: 'ACTIVE',
        showOnLanding: true
      },
      include: {
        planIntervals: {
          where: { isActive: true },
          orderBy: { interval: 'asc' }
        },
        featureLimits: {
          where: { showInComparison: true },
          include: {
            feature: {
              include: { module: true }
            }
          },
          orderBy: { comparisonOrder: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Converter sections para mapa
    const sectionsMap: Record<string, any> = {};
    sections.forEach(s => {
      sectionsMap[s.key] = {
        ...s,
        content: s.content ? s.content : {}
      };
    });

    return {
      sections: sectionsMap,
      sectionsList: sections,
      faqs: faqs.length > 0 ? faqs : defaultFaqs,
      testimonials: testimonials.length > 0 ? testimonials : defaultTestimonials,
      settings,
      plans,
      defaultContent
    };
  } catch (error) {
    console.error('Error fetching landing data:', error);
    return {
      sections: {},
      sectionsList: [],
      faqs: defaultFaqs,
      testimonials: defaultTestimonials,
      settings: {},
      plans: [],
      defaultContent
    };
  }
}

export default async function HomePage() {
  const data = await getLandingData();
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LandingPage data={data} />
    </Suspense>
  );
}
