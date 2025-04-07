import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isValidInput } from "@/lib/validators/validators";
import { verifyHotelOwner, verifyToken } from "@/lib/middleware/middleware";
import { CreateHotelRequestBody } from "@/app/api/types/hotel";
import { Hotel } from "@prisma/client";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse and cast the JSON body.
    const { name, logo, address, location, rating, images } =
      (await request.json()) as CreateHotelRequestBody;

    // Authorization check.
    const authResponse = verifyToken(request);
    if (authResponse.status !== 200) return authResponse;

    // Validate hotel name.
    if (!isValidInput(name, "string")) {
      return NextResponse.json({ error: "Hotel name is invalid" }, { status: 400 });
    }

    // Validate logo if provided.
    if (logo != null && (typeof logo !== "string" || logo.trim() === "")) {
      return NextResponse.json({ error: "Logo is invalid" }, { status: 400 });
    }

    // Validate address.
    if (typeof address !== "string" || address.trim() === "") {
      return NextResponse.json({ error: "Address is invalid" }, { status: 400 });
    }

    // Validate location.
    if (typeof location !== "string" || location.trim() === "") {
      return NextResponse.json({ error: "Location is invalid" }, { status: 400 });
    }

    // Validate rating if provided.
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating is invalid" }, { status: 400 });
    }

    // Validate images if provided.
    if (images !== undefined && !Array.isArray(images)) {
      return NextResponse.json({ error: "Images are invalid" }, { status: 400 });
    }

    // Retrieve owner ID from the authorization response headers.
    const ownerId = authResponse.headers.get("x-user-id");

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized: missing owner ID" }, { status: 401 });
    }

    // Create new hotel in the database.
    const hotel = await prisma.hotel.create({
      data: {
        name,
        logo,
        address,
        location,
        rating,
        images,
        owner: {
          connect: { id: ownerId },
        },
      }
    });

    return NextResponse.json(
      { message: "Hotel created successfully", hotel },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Authorization check.
    const authResponse = verifyToken(request);
    if (authResponse.status !== 200) return authResponse;

    // Retrieve owner ID from the authorization response headers.
    const ownerId = authResponse.headers.get("x-user-id");
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized: missing owner ID" }, { status: 401 });
    }

    // Get hotels for current user.
    const hotels = await prisma.hotel.findMany({
      where: { owner: { id: ownerId } }
    });

    return NextResponse.json({ hotels }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
