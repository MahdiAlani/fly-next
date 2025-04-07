import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyToken } from "@/lib/middleware/middleware";

export async function GET(request: Request): Promise<NextResponse> {
  // Verify token (assumes verifyToken returns a NextResponse-like object with status and headers)
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;

  try {
    // Get the user id from the token headers
    const id = authResponse.headers.get("x-user-id");
    if (!id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Count unread notifications for the user
    const unreadCount = await prisma.notification.count({
      where: {
        userId: id,
        isRead: false,
      },
    });

    return NextResponse.json({ unread: unreadCount }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
