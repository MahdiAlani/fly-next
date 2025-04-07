import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyToken } from "@/lib/middleware/middleware";
import { isValidEmail, isValidPhoneNumber } from "@/lib/validators/validators";

// Endpoint: /api/user

export async function PUT(request: Request): Promise<NextResponse> {
  // Verify token
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;

  try {
    // Get id from jwt
    const id = authResponse.headers.get("x-user-id");
    if (!id) {
      return NextResponse.json({ error: "User ID not found in token" }, { status: 401 });
    }

    // Get the parameters to update
    const { firstName, lastName, email, phoneNumber, profilePic } = await request.json();

    // Validate email (if passed) and check uniqueness
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email is invalid" }, { status: 400 });
    }
    const existingEmailUser = await prisma.user.findUnique({ where: { email } });
    if (existingEmailUser && existingEmailUser.id !== id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Validate phone number (if passed) and check uniqueness
    if (phoneNumber) {
      if (!isValidPhoneNumber(phoneNumber)) {
        return NextResponse.json({ error: "Phone number is invalid" }, { status: 400 });
      }
      const existingPhoneUser = await prisma.user.findUnique({ where: { phoneNumber } });
      if (existingPhoneUser && existingPhoneUser.id !== id) {
        return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
      }
    }

    console.log(profilePic);

    // Update the user based on the passed parameters.
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        profilePic,
      },
    });

    return NextResponse.json(
      { message: "Successfully updated user", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  // Verify token
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;

  try {
    // Get id from jwt
    const id = authResponse.headers.get("x-user-id");
    if (!id) {
      return NextResponse.json({ error: "User ID not found in token" }, { status: 401 });
    }

    // Get user data from db
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePic: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}