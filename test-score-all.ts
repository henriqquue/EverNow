import { PrismaClient } from '@prisma/client';
import { calculateProfileCompleteness } from './lib/profile-completeness';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, profileComplete: true } });
  console.log("Users and their saved completeness:");
  console.table(users);

  console.log("\nRecalculating for all...");
  for (const user of users) {
    const score = await calculateProfileCompleteness(user.id);
    console.log(`User ${user.name} (${user.id}): DB says ${user.profileComplete}%, Calc says ${score}%`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
