import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isValidInput, isValidEmail } from "@/lib/validators/validators";
import { LoginRequestBody } from "@/app/api/types/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse and typecast the JSON body to LoginRequestBody.
    const { email, password } = (await request.json()) as LoginRequestBody;
    // Validate email.
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email is invalid" }, { status: 400 });
    }

    // Validate password input.
    if (!isValidInput(password, "string")) {
      return NextResponse.json({ error: "Password not provided" }, { status: 400 });
    }

    // Find user by email.
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If no user is found, return a 404.
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify that the provided password matches the stored hashed password.
    const passwordValid: boolean = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Ensure that the necessary JWT keys are available.
    const jwtAccessKey = process.env.JWT_ACCESS_KEY;
    const jwtRefreshKey = process.env.JWT_REFRESH_KEY;

    if (!jwtAccessKey || !jwtRefreshKey) {
      return NextResponse.json(
        { error: "JWT keys are not properly configured" },
        { status: 500 }
      );
    }

    // Generate the access and refresh tokens.
    const accessToken = jwt.sign({ userID: user.id }, jwtAccessKey, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign({ userID: user.id }, jwtRefreshKey, {
      expiresIn: "7d",
    });

    // Return the tokens in a JSON response.
    const accessTokenExpiresInSeconds = 30 * 60;
    
    return NextResponse.json(
      { accessToken, refreshToken, expiresIn: accessTokenExpiresInSeconds },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Optionally, you can log the error here or provide more detailed error info.
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
