const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.report.count();
  console.log(`Total reports in database: ${count}`);
  const lastFive = await prisma.report.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, reason: true, status: true, createdAt: true }
  });
  console.log('Last 5 reports:', JSON.stringify(lastFive, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
