import prisma from "@/lib/db";
import { UserRole } from "@prisma/client";

export type NotificationType = "info" | "success" | "warning" | "error" | "message" | "like" | "match" | "report" | "verification";

export async function createNotification(userId: string, data: {
  title: string;
  message: string;
  type?: NotificationType | string;
  metadata?: any;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyMatches: true, notifyMessages: true, notifyLikes: true, notifyMarketing: true }
  });

  if (user) {
    const t = (data.type || "info").toLowerCase();
    if (t === "match" && !user.notifyMatches) return null;
    if (t === "message" && !user.notifyMessages) return null;
    if (t === "like" && !user.notifyLikes) return null;
    if (t === "marketing" && !user.notifyMarketing) return null;
  }

  return prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type || "info",
      data: data.metadata || {},
    },
  });
}

export async function notifyAdmins(data: {
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}) {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPERADMIN"] }
    },
    select: { id: true }
  });

  return Promise.all(
    admins.map(admin => 
      createNotification(admin.id, data)
    )
  );
}

export async function notifyUser(userId: string, data: {
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}) {
  return createNotification(userId, data);
}
