export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// API pública para buscar dados da landing page
export async function GET(req: NextRequest) {
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

    // Formatar seções como objeto para fácil acesso
    const sectionsMap: Record<string, any> = {};
    sections.forEach(s => {
      sectionsMap[s.key] = s;
    });

    return NextResponse.json({
      sections: sectionsMap,
      sectionsList: sections,
      faqs,
      testimonials,
      settings,
      plans
    });
  } catch (error) {
    console.error('Error fetching landing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

