import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Create Plans
  console.log("Criando planos...");
  const freePlan = await prisma.plan.upsert({
    where: { slug: "gratuito" },
    update: {
      shortDescription: "Comece sua jornada",
      showOnLanding: true,
      showInComparison: true,
    },
    create: {
      name: "Gratuito",
      slug: "gratuito",
      shortDescription: "Comece sua jornada",
      longDescription: "Plano gratuito com recursos básicos para conhecer a plataforma",
      price: 0,
      status: "ACTIVE",
      order: 1,
      popular: false,
      isHighlighted: false,
      showOnLanding: true,
      showInComparison: true,
      hasTrial: false,
      features: {
        curtidas_por_dia: 5,
        super_curtidas_por_semana: 1,
        mensagens_por_dia: 10,
        filtros_avancados: false,
        ver_quem_curtiu: false,
        passaporte: false,
      },
      limits: {
        max_photos: 4,
        max_interests: 5,
      },
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { slug: "premium" },
    update: {
      shortDescription: "Experiência completa",
      badge: "Mais Popular",
      highlightColor: "#8B5CF6",
      isHighlighted: true,
      showOnLanding: true,
      showInComparison: true,
    },
    create: {
      name: "Premium",
      slug: "premium",
      shortDescription: "Experiência completa",
      longDescription: "Acesso ilimitado a todos os recursos premium",
      price: 49.9,
      discountPrice: 34.93,
      badge: "Mais Popular",
      highlightColor: "#8B5CF6",
      status: "ACTIVE",
      order: 2,
      popular: true,
      isHighlighted: true,
      showOnLanding: true,
      showInComparison: true,
      hasTrial: true,
      trialDays: 7,
      features: {
        curtidas_por_dia: -1, // unlimited
        super_curtidas_por_dia: 5,
        mensagens_por_dia: -1, // unlimited
        filtros_avancados: true,
        ver_quem_curtiu: true,
        passaporte: true,
        sem_anuncios: true,
        perfil_destacado: true,
      },
      limits: {
        max_photos: 9,
        max_interests: 20,
      },
    },
  });

  // Create Plan Intervals
  console.log("Criando periodicidades dos planos...");
  
  // Free plan intervals (just monthly, price 0)
  await prisma.planInterval.upsert({
    where: { planId_interval: { planId: freePlan.id, interval: "MONTHLY" } },
    update: {},
    create: {
      planId: freePlan.id,
      interval: "MONTHLY",
      price: 0,
      isActive: true,
    },
  });

  // Premium plan intervals
  await prisma.planInterval.upsert({
    where: { planId_interval: { planId: premiumPlan.id, interval: "MONTHLY" } },
    update: {},
    create: {
      planId: premiumPlan.id,
      interval: "MONTHLY",
      price: 49.9,
      discountPrice: 34.93,
      isActive: true,
    },
  });

  await prisma.planInterval.upsert({
    where: { planId_interval: { planId: premiumPlan.id, interval: "YEARLY" } },
    update: {},
    create: {
      planId: premiumPlan.id,
      interval: "YEARLY",
      price: 419.88, // 34.99 * 12
      discountPrice: 335.9, // ~20% off
      discountPercent: 20,
      isActive: true,
    },
  });

  // Create Modules
  console.log("Criando módulos...");
  const modules = await Promise.all([
    prisma.module.upsert({
      where: { slug: "perfil" },
      update: {},
      create: { name: "Perfil", slug: "perfil", description: "Gerenciamento de perfil", icon: "User", status: "ACTIVE", order: 1 },
    }),
    prisma.module.upsert({
      where: { slug: "busca" },
      update: {},
      create: { name: "Busca", slug: "busca", description: "Descobrir pessoas", icon: "Search", status: "ACTIVE", order: 2 },
    }),
    prisma.module.upsert({
      where: { slug: "matches" },
      update: {},
      create: { name: "Conexões", slug: "matches", description: "Sistema de conexões", icon: "Heart", status: "ACTIVE", order: 3 },
    }),
    prisma.module.upsert({
      where: { slug: "chat" },
      update: {},
      create: { name: "Chat", slug: "chat", description: "Mensagens", icon: "MessageCircle", status: "ACTIVE", order: 4 },
    }),
    prisma.module.upsert({
      where: { slug: "passaporte" },
      update: {},
      create: { name: "Viagem", slug: "passaporte", description: "Mudar localização", icon: "Globe", status: "ACTIVE", order: 5 },
    }),
  ]);

  // Create Features
  console.log("Criando funcionalidades...");
  const matchesModule = modules.find(m => m.slug === "matches")!;
  const chatModule = modules.find(m => m.slug === "chat")!;
  const buscaModule = modules.find(m => m.slug === "busca")!;
  const passaporteModule = modules.find(m => m.slug === "passaporte")!;
  const perfilModule = modules.find(m => m.slug === "perfil")!;

  const features = await Promise.all([
    prisma.feature.upsert({
      where: { slug: "curtidas_por_dia" },
      update: { showInComparison: true, comparisonOrder: 1, comparisonLabel: "Curtidas diárias", resetPeriod: "DAILY" },
      create: { 
        moduleId: matchesModule.id, 
        name: "Curtidas por dia", 
        slug: "curtidas_por_dia", 
        type: "LIMIT", 
        defaultLimit: 5,
        resetPeriod: "DAILY",
        showInComparison: true,
        comparisonOrder: 1,
        comparisonLabel: "Curtidas diárias"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "super_curtidas_por_dia" },
      update: { showInComparison: true, comparisonOrder: 2, comparisonLabel: "Sinais Fortes", resetPeriod: "DAILY" },
      create: { 
        moduleId: matchesModule.id, 
        name: "Sinais Fortes por dia", 
        slug: "super_curtidas_por_dia", 
        type: "LIMIT", 
        defaultLimit: 0,
        resetPeriod: "DAILY",
        showInComparison: true,
        comparisonOrder: 2,
        comparisonLabel: "Sinais Fortes"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "mensagens_por_dia" },
      update: { showInComparison: true, comparisonOrder: 3, comparisonLabel: "Mensagens diárias", resetPeriod: "DAILY" },
      create: { 
        moduleId: chatModule.id, 
        name: "Mensagens por dia", 
        slug: "mensagens_por_dia", 
        type: "LIMIT", 
        defaultLimit: 10,
        resetPeriod: "DAILY",
        showInComparison: true,
        comparisonOrder: 3,
        comparisonLabel: "Mensagens diárias"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "filtros_avancados" },
      update: { showInComparison: true, comparisonOrder: 4, comparisonLabel: "Filtros avançados" },
      create: { 
        moduleId: buscaModule.id, 
        name: "Filtros avançados", 
        slug: "filtros_avancados", 
        type: "BOOLEAN", 
        defaultLimit: 0,
        showInComparison: true,
        comparisonOrder: 4,
        comparisonLabel: "Filtros avançados"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "ver_quem_curtiu" },
      update: { showInComparison: true, comparisonOrder: 5, comparisonLabel: "Ver quem curtiu você" },
      create: { 
        moduleId: matchesModule.id, 
        name: "Ver quem curtiu", 
        slug: "ver_quem_curtiu", 
        type: "BOOLEAN", 
        defaultLimit: 0,
        showInComparison: true,
        comparisonOrder: 5,
        comparisonLabel: "Ver quem curtiu você"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "passaporte" },
      update: { showInComparison: true, comparisonOrder: 6, comparisonLabel: "Viagem global" },
      create: { 
        moduleId: passaporteModule.id, 
        name: "Viagem global", 
        slug: "passaporte", 
        type: "BOOLEAN", 
        defaultLimit: 0,
        showInComparison: true,
        comparisonOrder: 6,
        comparisonLabel: "Viagem global"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "modo_invisivel" },
      update: { showInComparison: true, comparisonOrder: 7, comparisonLabel: "Modo Discreto" },
      create: { 
        moduleId: perfilModule.id, 
        name: "Modo Discreto", 
        slug: "modo_invisivel", 
        type: "BOOLEAN", 
        defaultLimit: 0,
        showInComparison: true,
        comparisonOrder: 7,
        comparisonLabel: "Modo Discreto"
      },
    }),
    prisma.feature.upsert({
      where: { slug: "boost_perfil" },
      update: { showInComparison: true, comparisonOrder: 8, comparisonLabel: "Impulsos de perfil/mês", resetPeriod: "MONTHLY" },
      create: { 
        moduleId: perfilModule.id, 
        name: "Impulso de perfil", 
        slug: "boost_perfil", 
        type: "LIMIT", 
        defaultLimit: 0,
        resetPeriod: "MONTHLY",
        showInComparison: true,
        comparisonOrder: 8,
        comparisonLabel: "Impulsos de perfil/mês"
      },
    }),
  ]);

  // Create Feature Limits
  console.log("Criando limites por plano...");
  
  // Define feature configurations for each plan
  const featureConfigs: Record<string, { free: { limitValue: number; unlimited: boolean; enabled: boolean }; premium: { limitValue: number; unlimited: boolean; enabled: boolean } }> = {
    curtidas_por_dia: { 
      free: { limitValue: 5, unlimited: false, enabled: true }, 
      premium: { limitValue: 0, unlimited: true, enabled: true } 
    },
    super_curtidas_por_dia: { 
      free: { limitValue: 1, unlimited: false, enabled: true }, 
      premium: { limitValue: 5, unlimited: false, enabled: true } 
    },
    mensagens_por_dia: { 
      free: { limitValue: 10, unlimited: false, enabled: true }, 
      premium: { limitValue: 0, unlimited: true, enabled: true } 
    },
    filtros_avancados: { 
      free: { limitValue: 0, unlimited: false, enabled: false }, 
      premium: { limitValue: 1, unlimited: false, enabled: true } 
    },
    ver_quem_curtiu: { 
      free: { limitValue: 0, unlimited: false, enabled: false }, 
      premium: { limitValue: 1, unlimited: false, enabled: true } 
    },
    passaporte: { 
      free: { limitValue: 0, unlimited: false, enabled: false }, 
      premium: { limitValue: 1, unlimited: false, enabled: true } 
    },
    modo_invisivel: { 
      free: { limitValue: 0, unlimited: false, enabled: false }, 
      premium: { limitValue: 1, unlimited: false, enabled: true } 
    },
    boost_perfil: { 
      free: { limitValue: 0, unlimited: false, enabled: false }, 
      premium: { limitValue: 3, unlimited: false, enabled: true } 
    },
  };

  for (const feature of features) {
    const config = featureConfigs[feature.slug];
    if (!config) continue;

    // Free plan limits
    await prisma.featureLimit.upsert({
      where: { planId_featureId: { planId: freePlan.id, featureId: feature.id } },
      update: { enabled: config.free.enabled },
      create: {
        planId: freePlan.id,
        featureId: feature.id,
        limitValue: config.free.limitValue,
        unlimited: config.free.unlimited,
        enabled: config.free.enabled,
        isVisibleLocked: !config.free.enabled, // Show locked features
        blockMessage: !config.free.enabled ? `${feature.name} está disponível no plano Premium` : undefined,
        ctaText: !config.free.enabled ? "Fazer Upgrade" : undefined,
      },
    });

    // Premium plan limits
    await prisma.featureLimit.upsert({
      where: { planId_featureId: { planId: premiumPlan.id, featureId: feature.id } },
      update: { enabled: config.premium.enabled },
      create: {
        planId: premiumPlan.id,
        featureId: feature.id,
        limitValue: config.premium.limitValue,
        unlimited: config.premium.unlimited,
        enabled: config.premium.enabled,
      },
    });
  }

  // Create Tenant
  console.log("Criando tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "evernow" },
    update: {},
    create: {
      name: "EverNOW",
      slug: "evernow",
      status: "ACTIVE",
      settings: {
        theme: "light",
        language: "pt-BR",
      },
    },
  });

  // Create Users
  console.log("Criando usuários...");
  
  // SuperAdmin
  const superAdminPassword = await bcrypt.hash("Super@123", 12);
  await prisma.user.upsert({
    where: { email: "superadmin@evernow.com" },
    update: {},
    create: {
      email: "superadmin@evernow.com",
      passwordHash: superAdminPassword,
      name: "Super Admin",
      role: "SUPERADMIN",
      status: "ACTIVE",
      tenantId: tenant.id,
      planId: premiumPlan.id,
      profileComplete: 100,
    },
  });

  // Admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@evernow.com" },
    update: {},
    create: {
      email: "admin@evernow.com",
      passwordHash: adminPassword,
      name: "Admin Operacional",
      role: "ADMIN",
      status: "ACTIVE",
      tenantId: tenant.id,
      planId: premiumPlan.id,
      profileComplete: 100,
    },
  });

  // Test user (required by framework)
  const testPassword = await bcrypt.hash("johndoe123", 12);
  await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      passwordHash: testPassword,
      name: "John Doe",
      role: "USER",
      status: "ACTIVE",
      tenantId: tenant.id,
      planId: premiumPlan.id,
      profileComplete: 100,
    },
  });

  // 5 Free users
  const freeUserPassword = await bcrypt.hash("user@123", 12);
  const freeUsers = [
    { name: "Ana Silva", email: "ana.silva@email.com", gender: "FEMALE" as const },
    { name: "Pedro Santos", email: "pedro.santos@email.com", gender: "MALE" as const },
    { name: "Julia Costa", email: "julia.costa@email.com", gender: "FEMALE" as const },
    { name: "Carlos Lima", email: "carlos.lima@email.com", gender: "MALE" as const },
    { name: "Mariana Oliveira", email: "mariana.oliveira@email.com", gender: "FEMALE" as const },
  ];

  for (const user of freeUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: freeUserPassword,
        name: user.name,
        role: "USER",
        status: "ACTIVE",
        tenantId: tenant.id,
        planId: freePlan.id,
        gender: user.gender,
        lookingFor: "SERIOUS",
        city: "São Paulo",
        state: "SP",
        country: "Brasil",
        profileComplete: 50,
        bio: "Buscando conexões genuinas.",
      },
    });

    // Create subscription for free users
    await prisma.subscription.upsert({
      where: { userId: createdUser.id },
      update: {},
      create: {
        userId: createdUser.id,
        planId: freePlan.id,
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        amount: 0,
      },
    });
  }

  // 5 Premium users
  const premiumUserPassword = await bcrypt.hash("premium@123", 12);
  const premiumUsers = [
    { name: "Fernanda Rocha", email: "fernanda.rocha@email.com", gender: "FEMALE" as const },
    { name: "Lucas Mendes", email: "lucas.mendes@email.com", gender: "MALE" as const },
    { name: "Beatriz Almeida", email: "beatriz.almeida@email.com", gender: "FEMALE" as const },
    { name: "Rafael Souza", email: "rafael.souza@email.com", gender: "MALE" as const },
    { name: "Camila Ferreira", email: "camila.ferreira@email.com", gender: "FEMALE" as const },
  ];

  for (const user of premiumUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: premiumUserPassword,
        name: user.name,
        role: "USER",
        status: "ACTIVE",
        tenantId: tenant.id,
        planId: premiumPlan.id,
        gender: user.gender,
        lookingFor: "SERIOUS",
        city: "Rio de Janeiro",
        state: "RJ",
        country: "Brasil",
        profileComplete: 80,
        bio: "Assinante premium buscando algo especial.",
      },
    });

    // Create subscription for premium users
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId: createdUser.id },
      update: {},
      create: {
        userId: createdUser.id,
        planId: premiumPlan.id,
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        amount: 34.93,
        expiresAt,
      },
    });
  }

  // Create Profile Categories
  console.log("Criando categorias de perfil...");
  const profileCategories = [
    { slug: "basico", name: "Básico", description: "Informações básicas sobre você", icon: "User", order: 1, required: true, hasIAm: true, hasIWant: false },
    { slug: "intencao", name: "Intenção", description: "O que você está buscando", icon: "Heart", order: 2, required: true, hasIAm: true, hasIWant: true },
    { slug: "aparencia", name: "Aparência e Corpo", description: "Características físicas", icon: "Smile", order: 3, required: false, hasIAm: true, hasIWant: true },
    { slug: "familia", name: "Família", description: "Filhos e planos familiares", icon: "Users", order: 4, required: false, hasIAm: true, hasIWant: true },
    { slug: "religiao", name: "Religião", description: "Crenças e espiritualidade", icon: "Sparkles", order: 5, required: false, hasIAm: true, hasIWant: true },
    { slug: "estilo-vida", name: "Estilo de Vida", description: "Como você vive seu dia a dia", icon: "Activity", order: 6, required: false, hasIAm: true, hasIWant: true },
    { slug: "habitos", name: "Hábitos", description: "Seus hábitos e rotina", icon: "Coffee", order: 7, required: false, hasIAm: true, hasIWant: true },
    { slug: "cultura", name: "Cultura e Entretenimento", description: "Música, filmes, séries e mais", icon: "Music", order: 8, required: false, hasIAm: true, hasIWant: true },
    { slug: "pets", name: "Pets", description: "Animais de estimação", icon: "Cat", order: 9, required: false, hasIAm: true, hasIWant: true },
    { slug: "profissao", name: "Profissão e Educação", description: "Carreira e formação", icon: "Briefcase", order: 10, required: false, hasIAm: true, hasIWant: false },
    { slug: "encontro", name: "Preferências de Encontro", description: "Como você gosta de encontros", icon: "MapPin", order: 11, required: false, hasIAm: true, hasIWant: true },
  ];

  const createdCategories = [];
  for (const cat of profileCategories) {
    const created = await prisma.profileCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
        required: cat.required,
        hasIAm: cat.hasIAm,
        hasIWant: cat.hasIWant,
        status: "ACTIVE",
      },
    });
    createdCategories.push(created);
  }

  // Create Profile Options for each category
  console.log("Criando opções de perfil...");
  const categoryOptionsMap: Record<string, { name: string; slug: string }[]> = {
    intencao: [
      { name: "Relacionamento sério", slug: "relacionamento-serio" },
      { name: "Namoro", slug: "namoro" },
      { name: "Date", slug: "date" },
      { name: "Casual", slug: "casual" },
      { name: "Amizade", slug: "amizade" },
      { name: "Ainda não sei", slug: "ainda-nao-sei" },
    ],
    aparencia: [
      { name: "Magro", slug: "magro" },
      { name: "Atlético", slug: "atletico" },
      { name: "Musculoso", slug: "musculoso" },
      { name: "Corpo médio", slug: "corpo-medio" },
      { name: "Curvilíneo", slug: "curvilineo" },
      { name: "Plus size", slug: "plus-size" },
    ],
    familia: [
      { name: "Não tenho filhos", slug: "sem-filhos" },
      { name: "Tenho filhos", slug: "com-filhos" },
      { name: "Quero filhos", slug: "quer-filhos" },
      { name: "Não quero filhos", slug: "nao-quer-filhos" },
      { name: "Aceito alguém com filhos", slug: "aceita-filhos" },
    ],
    religiao: [
      { name: "Católico", slug: "catolico" },
      { name: "Evangélico", slug: "evangelico" },
      { name: "Espírita", slug: "espirita" },
      { name: "Agnóstico", slug: "agnostico" },
      { name: "Ateu", slug: "ateu" },
      { name: "Outro", slug: "outro" },
    ],
    "estilo-vida": [
      { name: "Sedentário", slug: "sedentario" },
      { name: "Moderado", slug: "moderado" },
      { name: "Atleta", slug: "atleta" },
      { name: "Academia", slug: "academia" },
      { name: "Caseiro", slug: "caseiro" },
      { name: "Vida noturna", slug: "vida-noturna" },
      { name: "Viajar", slug: "viajar" },
    ],
    habitos: [
      { name: "Não fumo", slug: "nao-fumo" },
      { name: "Fumo", slug: "fumo" },
      { name: "Não bebo", slug: "nao-bebo" },
      { name: "Bebo socialmente", slug: "bebo-socialmente" },
      { name: "Vegetariano", slug: "vegetariano" },
      { name: "Vegano", slug: "vegano" },
    ],
    cultura: [
      { name: "Rock", slug: "rock" },
      { name: "Pop", slug: "pop" },
      { name: "MPB", slug: "mpb" },
      { name: "Sertanejo", slug: "sertanejo" },
      { name: "Eletrônica", slug: "eletronica" },
      { name: "Hip Hop", slug: "hip-hop" },
      { name: "Gospel", slug: "gospel" },
    ],
    pets: [
      { name: "Tenho cachorro", slug: "tenho-cachorro" },
      { name: "Tenho gato", slug: "tenho-gato" },
      { name: "Amo animais", slug: "amo-animais" },
      { name: "Prefiro sem animais", slug: "prefiro-sem" },
    ],
    encontro: [
      { name: "Café", slug: "cafe" },
      { name: "Restaurante", slug: "restaurante" },
      { name: "Bar", slug: "bar" },
      { name: "Cinema", slug: "cinema" },
      { name: "Caminhada", slug: "caminhada" },
      { name: "Viagem", slug: "viagem" },
    ],
  };

  for (const category of createdCategories) {
    const options = categoryOptionsMap[category.slug] || [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      await prisma.profileOption.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: opt.slug } },
        update: {},
        create: {
          categoryId: category.id,
          name: opt.name,
          slug: opt.slug,
          order: i + 1,
          isMultiple: true,
          status: "ACTIVE",
        },
      });
    }
  }

  // Create Compatibility Weights
  console.log("Criando pesos de compatibilidade...");
  const defaultWeights: Record<string, { weight: number; boostMatch: number; penalty: number }> = {
    basico: { weight: 0.5, boostMatch: 0.05, penalty: 0.05 },
    intencao: { weight: 2.0, boostMatch: 0.3, penalty: 0.4 },
    aparencia: { weight: 0.8, boostMatch: 0.1, penalty: 0.05 },
    familia: { weight: 1.5, boostMatch: 0.2, penalty: 0.3 },
    religiao: { weight: 1.2, boostMatch: 0.15, penalty: 0.2 },
    "estilo-vida": { weight: 1.0, boostMatch: 0.15, penalty: 0.1 },
    habitos: { weight: 0.8, boostMatch: 0.1, penalty: 0.1 },
    cultura: { weight: 0.7, boostMatch: 0.1, penalty: 0.05 },
    pets: { weight: 0.5, boostMatch: 0.05, penalty: 0.1 },
    profissao: { weight: 0.3, boostMatch: 0.05, penalty: 0.02 },
    encontro: { weight: 0.6, boostMatch: 0.1, penalty: 0.05 },
  };

  for (const category of createdCategories) {
    const weights = defaultWeights[category.slug];
    if (weights) {
      await prisma.compatibilityWeight.upsert({
        where: { categoryId: category.id },
        update: {},
        create: {
          categoryId: category.id,
          weight: weights.weight,
          boostMatch: weights.boostMatch,
          penalty: weights.penalty,
        },
      });
    }
  }

  // Create CMS Blocks
  console.log("Criando blocos CMS...");
  const cmsBlocks = [
    { key: "hero_title", title: "Título do Hero", content: "Encontre sua conexão perfeita", type: "TEXT" as const },
    { key: "hero_subtitle", title: "Subtítulo do Hero", content: "Relacionamento sério ou encontro imediato. Você decide.", type: "TEXT" as const },
    { key: "about_section", title: "Seção Sobre", content: "<p>EverNOW é a plataforma de relacionamento que combina compatibilidade profunda com privacidade forte.</p>", type: "HTML" as const },
    { key: "terms_of_service", title: "Termos de Serviço", content: "<h1>Termos de Serviço</h1><p>Conteúdo dos termos...</p>", type: "HTML" as const },
    { key: "privacy_policy", title: "Política de Privacidade", content: "<h1>Política de Privacidade</h1><p>Conteúdo da política...</p>", type: "HTML" as const },
  ];

  for (const block of cmsBlocks) {
    await prisma.cmsBlock.upsert({
      where: { key: block.key },
      update: {},
      create: {
        key: block.key,
        title: block.title,
        content: block.content,
        type: block.type,
        status: "ACTIVE",
      },
    });
  }

  // Create System Settings
  console.log("Criando configurações do sistema...");
  const settings = [
    { key: "system_name", value: "EverNOW", type: "string", group: "general" },
    { key: "system_description", value: "Plataforma de relacionamento", type: "string", group: "general" },
    { key: "primary_color", value: "#8B5CF6", type: "string", group: "appearance" },
    { key: "secondary_color", value: "#3B82F6", type: "string", group: "appearance" },
    { key: "support_email", value: "suporte@evernow.com", type: "string", group: "contact" },
    { key: "support_phone", value: "+55 11 99999-9999", type: "string", group: "contact" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // ============================================
  // Profile Field Governance - Default Rules
  // ============================================
  const governanceRules = [
    // --- Direct User Fields ---
    { fieldKey: "name", fieldType: "direct", label: "Nome", group: "basico", displayOrder: 1, isRequired: true, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: false, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "bio", fieldType: "direct", label: "Bio / Sobre mim", group: "basico", displayOrder: 2, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: true },
    { fieldKey: "headline", fieldType: "direct", label: "Frase de destaque", group: "basico", displayOrder: 3, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: false, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "pronouns", fieldType: "direct", label: "Pronomes", group: "basico", displayOrder: 4, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "statusMood", fieldType: "direct", label: "Status / Humor", group: "basico", displayOrder: 5, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: false, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "birthDate", fieldType: "direct", label: "Data de nascimento", group: "basico", displayOrder: 6, isRequired: true, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: false, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true, description: "Idade exibida, não a data exata" },
    { fieldKey: "gender", fieldType: "direct", label: "Gênero", group: "basico", displayOrder: 7, isRequired: true, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: false, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true },
    { fieldKey: "lookingFor", fieldType: "direct", label: "Procurando", group: "basico", displayOrder: 8, isRequired: false, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true },
    { fieldKey: "city", fieldType: "direct", label: "Cidade", group: "basico", displayOrder: 9, isRequired: false, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: true },
    { fieldKey: "interests", fieldType: "direct", label: "Interesses", group: "basico", displayOrder: 10, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true },
    { fieldKey: "languages", fieldType: "direct", label: "Idiomas", group: "basico", displayOrder: 11, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: false, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "work", fieldType: "direct", label: "Trabalho", group: "profissional", displayOrder: 12, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: false, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "education", fieldType: "direct", label: "Educação", group: "profissional", displayOrder: 13, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: false, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false },
    { fieldKey: "photos", fieldType: "direct", label: "Fotos", group: "midia", displayOrder: 14, isRequired: true, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: true, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: false, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: true },
    // --- Category-based fields (ProfileCategory system) ---
    { fieldKey: "cat:basico", fieldType: "category", label: "Informações Básicas", group: "categorias", displayOrder: 20, isRequired: false, requiredInOnboarding: true, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true, icon: "User" },
    { fieldKey: "cat:intencao", fieldType: "category", label: "Intenção", group: "categorias", displayOrder: 21, isRequired: false, requiredInOnboarding: true, requiredBeforeDiscovery: true, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true, icon: "Heart" },
    { fieldKey: "cat:aparencia", fieldType: "category", label: "Aparência", group: "categorias", displayOrder: 22, isRequired: false, requiredInOnboarding: true, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true, icon: "Eye" },
    { fieldKey: "cat:familia", fieldType: "category", label: "Família", group: "categorias", displayOrder: 23, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: false, icon: "Users" },
    { fieldKey: "cat:religiao", fieldType: "category", label: "Religião", group: "categorias", displayOrder: 24, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: false, icon: "BookOpen" },
    { fieldKey: "cat:estilo-vida", fieldType: "category", label: "Estilo de Vida", group: "categorias", displayOrder: 25, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: true, icon: "Compass" },
    { fieldKey: "cat:habitos", fieldType: "category", label: "Hábitos", group: "categorias", displayOrder: 26, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: false, icon: "Coffee" },
    { fieldKey: "cat:cultura", fieldType: "category", label: "Cultura", group: "categorias", displayOrder: 27, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false, icon: "Music" },
    { fieldKey: "cat:pets", fieldType: "category", label: "Pets", group: "categorias", displayOrder: 28, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false, icon: "PawPrint" },
    { fieldKey: "cat:profissao", fieldType: "category", label: "Profissão", group: "categorias", displayOrder: 29, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: false, affectsDiscoveryRanking: false, icon: "Briefcase" },
    { fieldKey: "cat:encontro", fieldType: "category", label: "Encontro", group: "categorias", displayOrder: 30, isRequired: false, requiredInOnboarding: false, requiredBeforeDiscovery: false, visibleInOnboarding: true, visibleInProfileEdit: true, visibleInProfileCard: false, visibleInFullProfile: true, defaultPublicVisible: true, userCanToggleVisibility: true, hiddenByDefault: false, affectsCompatibility: true, affectsDiscoveryRanking: false, icon: "MapPin" },
  ];

  for (const rule of governanceRules) {
    await prisma.profileFieldGovernance.upsert({
      where: { fieldKey: rule.fieldKey },
      update: {
        label: rule.label,
        fieldType: rule.fieldType,
        group: rule.group,
        displayOrder: rule.displayOrder,
        icon: rule.icon ?? null,
        description: rule.description ?? null,
      },
      create: {
        ...rule,
        icon: rule.icon ?? null,
        description: rule.description ?? null,
        premiumOnly: false,
        verifiedOnly: false,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${governanceRules.length} governance rules seeded`);

  console.log("Seed concluído com sucesso!");
  console.log("\nCredenciais de acesso:");
  console.log("- SuperAdmin: superadmin@evernow.com / Super@123");
  console.log("- Admin: admin@evernow.com / Admin@123");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
