import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserEntitlements } from "@/lib/entitlement-service";

export const dynamic = "force-dynamic";

// GET /api/features/usage - Get all feature usage/entitlements for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entitlements = await getUserEntitlements(session.user.id);

    return NextResponse.json(entitlements);
  } catch (error) {
    console.error("Error fetching feature usage:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
