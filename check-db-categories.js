const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.profileCategory.findMany({ select: { name: true, slug: true } });
  const options = await prisma.profileOption.findMany({ select: { name: true, slug: true } });
  console.log(JSON.stringify({categories, options}, null, 2));
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
