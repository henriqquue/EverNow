import { PrismaClient } from '@prisma/client';
import { calculateProfileCompleteness } from './lib/profile-completeness';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Henrique' } }
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("Testing completeness for user:", user.id);
  const score = await calculateProfileCompleteness(user.id);
  console.log("Calculated Score:", score);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
