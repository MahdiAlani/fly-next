import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyToken } from "@/lib/middleware/middleware";
import { isValidInput } from "@/lib/validators/validators";

// Endpoint: /api/notifications

export async function GET(request: Request): Promise<NextResponse> {
  // Verify token (assumed to return a NextResponse-like object with status and headers)
  // Authorization check.
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;
  
  try {
    // Get id from JWT header (ensure it's not null)
    const id = authResponse.headers.get("x-user-id");
    if (!id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    // Get user's notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: id },
    });
    
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get notification data from the request body
    const { title, description } = await request.json();

    const authResponse = verifyToken(request);
    if (authResponse.status !== 200) return authResponse;

    const userId = authResponse.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!isValidInput(title, "string")) {
      return NextResponse.json({ error: "Title is invalid" }, { status: 400 });
    }
    if (!isValidInput(description, "string")) {
      return NextResponse.json({ error: "Description is invalid" }, { status: 400 });
    }

    // Check if the provided user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Could not find specified user" }, { status: 404 });
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        isRead: false,
      },
    });

    return NextResponse.json(
      { message: "Notification created successfully", notification },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
