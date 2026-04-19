import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: 'Henrique' }
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("Found user:", user.id);

  // Simulate what the API route does:
  const { calculateProfileCompleteness } = await import('./lib/profile-completeness');
  const completeness = await calculateProfileCompleteness(user.id);
  
  const finalUser = await prisma.user.update({
    where: { id: user.id },
    data: { profileComplete: completeness },
    select: { id: true, name: true, profileComplete: true }
  });

  console.log("Updated user in DB:", finalUser);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
