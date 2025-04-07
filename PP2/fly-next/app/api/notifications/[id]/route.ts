import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyToken } from "@/lib/middleware/middleware";
import { isValidInput } from "@/lib/validators/validators";

// Endpoint: /api/notifications/[id]
export async function PATCH(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  // Verify token; assume verifyToken returns a NextResponse-like object
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;

  try {
    // Extract user id from the token header; ensure it's present
    const userId = authResponse.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Extract notification id from route parameters
    const { id } = params;

    // Validate notification id
    if (!isValidInput(id, "string")) {
      return NextResponse.json({ error: "Notification id is not specified" }, { status: 400 });
    }

    // Check if the notification exists for the user
    const notifExists = await prisma.notification.findUnique({
      where: {
        id,
        userId,
      },
    });
    if (!notifExists) {
      return NextResponse.json({ error: "Notification does not exist" }, { status: 404 });
    }

    // Parse the request body to get the updated isRead status
    const { isRead } = await request.json();
    if (isRead === undefined) {
      return NextResponse.json({ error: "isRead status not specified" }, { status: 400 });
    }

    // Update notification; assumes your Notification model allows a composite unique where clause
    const notification = await prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: { isRead },
    });

    return NextResponse.json(
      { message: "Successfully updated notification", notification },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
