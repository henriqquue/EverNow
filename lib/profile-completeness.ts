import { prisma } from "@/lib/db";

export async function calculateProfileCompleteness(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPhotos: true,
      profileAnswers: {
        select: { optionId: true }
      }
    }
  });

  if (!user) return 0;

  let earnedPoints = 0;
  let totalPoints = 0;

  // 1. FOTOS (6 slots)
  const photoCount = Math.max(
    user.userPhotos?.length || 0,
    user.photos?.filter(p => p && p.trim() !== '').length || 0
  );
  totalPoints += 6;
  earnedPoints += Math.min(6, photoCount);

  // 2. INFORMAÇÕES BÁSICAS (6 campos)
  totalPoints += 6;
  if (user.name && user.name.trim().length > 0) earnedPoints += 1;
  if (user.bio && user.bio.trim().length > 0) earnedPoints += 1;
  if (user.birthDate) earnedPoints += 1;
  if (user.gender) earnedPoints += 1;
  if (user.lookingFor) earnedPoints += 1;
  if (user.languages && user.languages.length > 0) earnedPoints += 1;

  // 3. CARREIRA E EDUCAÇÃO (2 campos)
  totalPoints += 2;
  if (user.work && user.work.trim().length > 0) earnedPoints += 1;
  if (user.education && user.education.trim().length > 0) earnedPoints += 1;

  // 4. LOCALIZAÇÃO (1 campo lógico de cidade+estado)
  totalPoints += 1;
  if (user.city && user.state) earnedPoints += 1;

  // 5. CATEGORIAS DE INTERESSE
  // Contamos apenas categorias que possuem opções ativas e não são as redundantes
  const totalCategoriesCount = await prisma.profileCategory.count({
    where: { 
      status: 'ACTIVE',
      slug: { notIn: ['basico', 'intencao', 'profissao'] },
      options: { some: { status: 'ACTIVE' } }
    },
  });

  if (totalCategoriesCount > 0) {
    totalPoints += totalCategoriesCount;

    const answers = await prisma.userProfileAnswer.findMany({
      where: { 
        userId,
        option: { 
          status: 'ACTIVE',
          category: { 
            status: 'ACTIVE',
            slug: { notIn: ['basico', 'intencao', 'profissao'] } 
          } 
        }
      },
      include: { option: { select: { categoryId: true } } }
    });
    
    // Cada categoria com pelo menos uma resposta vale 1 ponto
    const uniqueCategoryIds = new Set(answers.map(a => a.option.categoryId));
    earnedPoints += uniqueCategoryIds.size;
  }

  if (totalPoints === 0) return 0;

  // Calcula a porcentagem exata
  const score = (earnedPoints / totalPoints) * 100;

  // DEBUG TEMPORÁRIO
  try {
    const fs = require('fs');
    const path = require('path');
    const debugPath = path.join(process.cwd(), 'completeness-debug.json');
    fs.writeFileSync(debugPath, JSON.stringify({
      score,
      earnedPoints,
      totalPoints,
      photoCount,
      totalCategoriesCount,
      basic: {
        name: !!(user.name && user.name.trim().length > 0),
        bio: !!(user.bio && user.bio.trim().length > 0),
        birthDate: !!user.birthDate,
        gender: !!user.gender,
        lookingFor: !!user.lookingFor,
        languages: !!(user.languages && user.languages.length > 0)
      },
      career: {
        work: !!(user.work && user.work.trim().length > 0),
        education: !!(user.education && user.education.trim().length > 0)
      },
      location: {
        cityAndState: !!(user.city && user.state)
      }
    }, null, 2));
  } catch (e) {
    console.error("Erro ao escrever debug", e);
  }

  // Math.floor garante que 99.9% não vire 100%. 100% só se earnedPoints == totalPoints.
  return Math.floor(score);
}
