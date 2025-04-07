import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isValidInput } from "@/lib/validators/validators";
import { verifyHotelOwner } from "@/lib/middleware/middleware";

// Endpoint: /api/hotels/[hotelId]/room-types
// Create a new room type for a hotel
export async function POST(request: Request,{ params }: { params: { hotelId: string } }): Promise<NextResponse> {
  try {
    // Get hotelId from the route params
    const { hotelId } = params;
    
    // Get room type data from the request body
    const { name, amenities, pricePerNight, images, rooms } = await request.json();

    // Verify hotel owner
    const ownerCheck = await verifyHotelOwner(request, hotelId);
    if (ownerCheck !== true) return ownerCheck;

    // Validate room type name
    if (!isValidInput(name, "string")) {
      return NextResponse.json(
        { error: "RoomType name is invalid" },
        { status: 400 }
      );
    }
    
    // Check if that room type already exists for this hotel
    const roomTypeExists = await prisma.roomType.findFirst({
      where: {
        name,
        hotelId,
      },
    });
    if (roomTypeExists) {
      return NextResponse.json(
        { error: "RoomType already exists for this hotel" },
        { status: 400 }
      );
    }

    // Validate amenities if provided
    if (amenities !== undefined && !Array.isArray(amenities)) {
      return NextResponse.json(
        { error: "Amenities are invalid" },
        { status: 400 }
      );
    }
    
    // Validate pricePerNight if provided
    if (pricePerNight !== undefined && typeof pricePerNight !== "number") {
      return NextResponse.json(
        { error: "Price per night is invalid" },
        { status: 400 }
      );
    }

    // Validate images if provided
    if (images !== undefined && !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Images are invalid" },
        { status: 400 }
      );
    }

    // Validate rooms if provided
    if (rooms !== undefined && typeof rooms !== "number") {
      return NextResponse.json(
        { error: "Rooms value is invalid" },
        { status: 400 }
      );
    }

    // Validate hotelId
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json(
        { error: "Hotel Id is invalid" },
        { status: 400 }
      );
    }
    // Check if the hotel exists
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json(
        { error: "Hotel does not exist" },
        { status: 404 }
      );
    }
    
    // Create new RoomType in the DB
    const roomType = await prisma.roomType.create({
      data: {
        name,
        amenities,
        pricePerNight,
        images,
        hotel: { connect: { id: hotelId } },
        rooms: rooms || 0,
      },
    });

    return NextResponse.json(
      { message: "RoomType created successfully", roomType },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Retrieve all room types for a hotel
export async function GET(request: Request, { params }: { params: { hotelId: string } }): Promise<NextResponse> {
  try {
    const { hotelId } = await params;

    // Validate hotelId
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json(
        { error: "Hotel Id is invalid" },
        { status: 400 }
      );
    }

    // Check if the hotel exists
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json(
        { error: "Hotel does not exist" },
        { status: 404 }
      );
    }

    // Retrieve all room types for the hotel
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId }
    });

    return NextResponse.json(
      { message: "RoomTypes retrieved successfully", roomTypes },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
