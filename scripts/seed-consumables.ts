import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛍️ Seeding consumíveis e boosts...");

  const consumables = [
    {
      name: "Boost de Perfil",
      slug: "boost-perfil",
      description: "Aumente sua visibilidade em 50% por 24 horas",
      type: "BOOST" as const,
      price: 9.99,
      quantity: null,
      durationDays: 1,
      icon: "🚀",
      color: "#FF6B9D",
      benefits: {
        visibility_boost: 1.5,
        priority_in_feed: true,
      },
      isPopular: false,
      order: 1,
    },
    {
      name: "SuperLike",
      slug: "superlike",
      description: "Envie um SuperLike especial que se destaca",
      type: "SUPERLIKES" as const,
      price: 4.99,
      quantity: 5,
      durationDays: null,
      icon: "⭐",
      color: "#FFD700",
      benefits: {
        special_notification: true,
      },
      isPopular: false,
      order: 2,
    },
    {
      name: "Spotlight 24h",
      slug: "spotlight-24h",
      description: "Fique no topo da fila de descoberta por 24 horas",
      type: "SPOTLIGHT" as const,
      price: 19.99,
      quantity: null,
      durationDays: 1,
      icon: "💡",
      color: "#FFA500",
      benefits: {
        visibility_boost: 3.0,
        priority_in_feed: true,
      },
      isPopular: true,
      order: 3,
    },
    {
      name: "Curtidas Ilimitadas",
      slug: "unlimited-likes",
      description: "Curtidas ilimitadas por 7 dias",
      type: "UNLIMITED_LIKES" as const,
      price: 29.99,
      quantity: null,
      durationDays: 7,
      icon: "❤️",
      color: "#FF1744",
      benefits: {
        unlimited_likes: true,
        likes_multiplier: 2,
      },
      isPopular: true,
      order: 4,
    },
    {
      name: "Ver Quem Curtiu",
      slug: "see-who-liked",
      description: "Veja quem curtiu você por 30 dias",
      type: "LIKES_NOTIFICATION" as const,
      price: 14.99,
      quantity: null,
      durationDays: 30,
      icon: "👀",
      color: "#9C27B0",
      benefits: {
        see_who_liked: true,
      },
      isPopular: false,
      order: 5,
    },
    {
      name: "Passaporte Global",
      slug: "travel-pass",
      description: "Viaje para qualquer cidade do mundo por 7 dias",
      type: "TRAVEL_PASS" as const,
      price: 39.99,
      quantity: null,
      durationDays: 7,
      icon: "🌍",
      color: "#00BCD4",
      benefits: {
        worldwide_access: true,
        location_change: true,
      },
      isPopular: true,
      order: 6,
    },
    {
      name: "Reseta o Deck",
      slug: "reset-stack",
      description: "Veja os mesmos perfis novamente",
      type: "RESET_STACK" as const,
      price: 2.99,
      quantity: 1,
      durationDays: null,
      icon: "🔄",
      color: "#4CAF50",
      benefits: {
        reset_discovery: true,
      },
      isPopular: false,
      order: 7,
    },
    {
      name: "Pack Viajante",
      slug: "traveler-pack",
      description: "3 boosts + Passaporte por 7 dias",
      type: "BOOST" as const,
      price: 59.99,
      quantity: null,
      durationDays: 7,
      icon: "✈️",
      color: "#FF6B9D",
      benefits: {
        visibility_boost: 2.0,
        priority_in_feed: true,
        worldwide_access: true,
      },
      isPopular: true,
      order: 8,
    },
  ];

  for (const consumable of consumables) {
    await prisma.consumableItem.upsert({
      where: { slug: consumable.slug },
      update: {},
      create: {
        ...consumable,
        status: "ACTIVE",
      },
    });

    console.log(`✅ Consumível criado: ${consumable.name}`);
  }

  console.log("✨ Seed de consumíveis concluído!");

  // Info
  console.log(`
  📊 Resumo:
  - ${consumables.length} consumíveis criados
  - Todos estão prontos para serem comprados

  🧪 Para testar:
  1. Acesse a página de Shop no app mobile
  2. Clique em qualquer boost para comprar
  3. A compra será processada (simulada por enquanto)
  `);
}

main()
  .catch((error) => {
    console.error("❌ Erro durante seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
