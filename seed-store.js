const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      name: "Boost de Perfil (1h)",
      slug: "boost-1h",
      description: "Seja visto por mais pessoas na sua região por 1 hora.",
      type: "BOOST",
      price: 9.90,
      currency: "BRL",
      durationDays: 0.04,
      icon: "Zap",
      color: "#6366f1",
      isPopular: true,
      status: "ACTIVE",
      order: 1,
      benefits: {
        visibility: "3x mais visibilidade",
        priority: "Prioridade no Discovery"
      }
    },
    {
      name: "Super Like (5 un)",
      slug: "super-like-5",
      description: "Envie 5 Super Likes para chamar a atenção de quem você gosta.",
      type: "SUPERLIKES",
      price: 14.90,
      currency: "BRL",
      quantity: 5,
      icon: "Star",
      color: "#f59e0b",
      isPopular: false,
      status: "ACTIVE",
      order: 2,
      benefits: {
        notice: "Notificação imediata",
        standout: "Destaque no chat"
      }
    }
  ];

  for (const item of items) {
    await prisma.consumableItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }

  console.log("Itens da loja semeados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
