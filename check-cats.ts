import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: 'Henrique' }
  });

  if (!user) return;

  const answers = await prisma.userProfileAnswer.findMany({
    where: { 
      userId: user.id,
      option: { 
        status: 'ACTIVE',
        category: { 
          status: 'ACTIVE',
          slug: { notIn: ['basico', 'intencao', 'profissao'] } 
        } 
      }
    },
    include: { option: { include: { category: true } } }
  });

  const categories = answers.map(a => a.option.category.name);
  const uniqueCategories = new Set(categories);
  console.log("Categories answered:", Array.from(uniqueCategories));
  console.log("Total unique categories:", uniqueCategories.size);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
