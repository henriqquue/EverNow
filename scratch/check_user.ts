
import { prisma } from '../lib/db';

async function checkUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, nickname: true }
  });
  console.log('User:', user);
}

// Replace with an actual ID from the database if you can find one, 
// or just list some users to see their IDs.
async function checkFirstUserDetails() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmo3a3rga001v517t8arqr3j6' },
    select: {
      id: true,
      name: true
    }
  });
  console.log('User Details:', JSON.stringify(user, null, 2));
}

checkFirstUserDetails();
