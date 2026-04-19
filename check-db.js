const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({ select: { name: true, slug: true, shortDescription: true } });
  const features = await prisma.feature.findMany({ select: { name: true, slug: true } });
  console.log(JSON.stringify({plans, features}, null, 2));
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
