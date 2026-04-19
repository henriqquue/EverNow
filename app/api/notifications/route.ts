import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email as string;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        notifyMatches: true,
        notifyMessages: true,
        notifyLikes: true,
        notifyMarketing: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const excludedTypes: string[] = [];
    if (!user.notifyMatches) excludedTypes.push('MATCH', 'match');
    if (!user.notifyMessages) excludedTypes.push('MESSAGE', 'message');
    if (!user.notifyLikes) excludedTypes.push('LIKE', 'like', 'SUPERLIKE', 'superlike');
    if (!user.notifyMarketing) excludedTypes.push('MARKETING', 'marketing', 'promo');

    const notifications = await prisma.notification.findMany({
      where: { 
        userId: user.id,
        ...(excludedTypes.length > 0 ? { type: { notIn: excludedTypes } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
