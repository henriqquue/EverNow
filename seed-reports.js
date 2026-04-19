const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedReports() {
  try {
    // Get some users
    const users = await prisma.user.findMany({ take: 3 });
    if (users.length < 2) {
      console.log('Not enough users to create reports');
      return;
    }

    const reporter = users[0];
    const reported1 = users[1];
    const reported2 = users[2] || users[1];

    console.log(`Creating dummy reports for ${reporter.name}...`);

    await prisma.report.create({
      data: {
        reporterId: reporter.id,
        reportedUserId: reported1.id,
        reason: 'INAPPROPRIATE_CONTENT',
        description: 'Postagem de fotos inadequadas no perfil.',
        status: 'PENDING',
      }
    });

    await prisma.report.create({
      data: {
        reporterId: reporter.id,
        reportedUserId: reported2.id,
        reason: 'FAKE_PROFILE',
        description: 'O perfil parece ser de uma pessoa famosa, claramente falso.',
        status: 'PENDING',
      }
    });

    await prisma.report.create({
      data: {
        reporterId: reported1.id,
        reportedUserId: reporter.id,
        reason: 'HARASSMENT',
        description: 'Comportamento agressivo no chat.',
        status: 'PENDING',
      }
    });

    console.log('Successfully created 3 dummy reports!');
  } catch (error) {
    console.error('Error seeding reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReports();
