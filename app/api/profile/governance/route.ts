export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOnboardingGovernance, getGovernanceRules } from '@/lib/profile-governance';

// GET governance rules for client-side (onboarding, profile edit)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || 'all';

    const rules = await getGovernanceRules();
    
    let filtered = rules;
    if (context === 'onboarding') {
      filtered = rules.filter(r => r.visibleInOnboarding);
    } else if (context === 'profile_edit') {
      filtered = rules.filter(r => r.visibleInProfileEdit);
    } else if (context === 'profile_card') {
      filtered = rules.filter(r => r.visibleInProfileCard);
    }

    // Only expose safe fields to client
    const safeRules = filtered.map(r => ({
      fieldKey: r.fieldKey,
      fieldType: r.fieldType,
      label: r.label,
      description: r.description,
      icon: r.icon,
      isRequired: r.isRequired,
      requiredInOnboarding: r.requiredInOnboarding,
      requiredBeforeDiscovery: r.requiredBeforeDiscovery,
      visibleInOnboarding: r.visibleInOnboarding,
      visibleInProfileEdit: r.visibleInProfileEdit,
      visibleInProfileCard: r.visibleInProfileCard,
      visibleInFullProfile: r.visibleInFullProfile,
      defaultPublicVisible: r.defaultPublicVisible,
      userCanToggleVisibility: r.userCanToggleVisibility,
      hiddenByDefault: r.hiddenByDefault,
      premiumOnly: r.premiumOnly,
      displayOrder: r.displayOrder,
      group: r.group,
    }));

    return NextResponse.json({ rules: safeRules });
  } catch (error) {
    console.error('Error fetching governance:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

