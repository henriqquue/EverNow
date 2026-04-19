const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.profileCategory.findMany({
    include: {
      options: {
        where: { parentId: null },
        include: { children: true }
      }
    }
  });
  console.log(JSON.stringify(cats.find(c => c.slug === 'habitos'), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
