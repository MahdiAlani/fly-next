import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { isValidInput } from "@/lib/validators/validators";
import { RefreshRequestBody, CustomJwtPayload } from "@/app/api/types/auth";

export async function POST(request: Request): Promise<NextResponse> {
  // Parse and typecast the JSON body.
  const { refreshToken } = (await request.json()) as RefreshRequestBody;

  // Validate that a refresh token was provided.
  if (!isValidInput(refreshToken, "string")) {
    return NextResponse.json(
      { error: "Token was not passed" },
      { status: 400 }
    );
  }

  // Ensure that the necessary JWT keys are available.
  const jwtRefreshKey = process.env.JWT_REFRESH_KEY;
  const jwtAccessKey = process.env.JWT_ACCESS_KEY;

  if (!jwtRefreshKey || !jwtAccessKey) {
    return NextResponse.json(
      { error: "JWT keys are not properly configured" },
      { status: 500 }
    );
  }

  try {
    // Verify the refresh token and assert its type.
    const decoded = jwt.verify(refreshToken, jwtRefreshKey) as CustomJwtPayload;

    // Generate a new access token using the userID from the decoded payload.
    const accessToken = jwt.sign({ userID: decoded.userID }, jwtAccessKey, {
      expiresIn: "30m",
    });

    // Return the new access token.
    return NextResponse.json({ accessToken }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Token is invalid" },
      { status: 401 }
    );
  }
}
