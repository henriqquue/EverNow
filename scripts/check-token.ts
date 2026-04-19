import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "henrique.rezende667@gmail.com" },
    select: { resetToken: true, resetTokenExpiry: true }
  });
  console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
