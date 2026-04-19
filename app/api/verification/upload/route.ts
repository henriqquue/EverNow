import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { storage } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

    const fileName = `${session.user.id}-${Date.now()}.png`;
    const publicUrl = await storage.upload(file, "verification", fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Verification upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
