const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiLogic() {
  const status = 'PENDING';
  const page = 1;
  const limit = 20;
  const where = { status };

  const [rawReports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            verificationStatus: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
        resolvedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.report.count({ where }),
  ]);

  const reports = rawReports.map((r) => ({
    ...r,
    reported: r.reportedUser
      ? {
          id: r.reportedUser.id,
          name: r.reportedUser.name,
          email: r.reportedUser.email,
          photoUrl: r.reportedUser.userPhotos?.[0]?.url ?? null,
          verificationStatus: r.reportedUser.verificationStatus,
          status: r.reportedUser.status,
        }
      : { id: '', name: 'Usuário removido', email: '', photoUrl: null, verificationStatus: null, status: null },
  }));

  console.log('Total found:', total);
  console.log('Reports count:', reports.length);
  if (reports.length > 0) {
    console.log('First report reported name:', reports[0].reported.name);
  }
}

testApiLogic().finally(() => prisma.$disconnect());
