import { prisma } from '../lib/db';

async function listHenriqueThreads() {
  const henriqueId = 'cmo37k2pr0005zm441ero49ng';
  
  const threads = await prisma.chatThread.findMany({
    where: {
      match: {
        OR: [
          { user1Id: henriqueId },
          { user2Id: henriqueId }
        ]
      }
    },
    include: {
      match: {
        include: {
          user1: { select: { id: true, name: true } },
          user2: { select: { id: true, name: true } }
        }
      }
    }
  });
  
  console.log('Threads:', JSON.stringify(threads, null, 2));
}

listHenriqueThreads();
