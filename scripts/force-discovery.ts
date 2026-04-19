import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    where: {
      role: 'USER',
      onboardingComplete: false
    }
  });

  console.log(`Encontrados ${users.length} usuários para atualizar.`);

  for (const user of users) {
    // 1. Mark onboarding as complete
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingComplete: true,
        status: 'ACTIVE',
        profileComplete: 100
      }
    });

    // 2. Add a dummy photo if they don't have any
    const photoCount = await prisma.userPhoto.count({
      where: { userId: user.id }
    });

    if (photoCount === 0) {
      await prisma.userPhoto.create({
        data: {
          userId: user.id,
          url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&size=512`,
          isMain: true,
          order: 0,
          isVerified: true
        }
      });
    }

    console.log(`Usuário ${user.name} (${user.email}) atualizado e visível!`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
