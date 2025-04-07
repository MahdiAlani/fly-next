import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { isValidInput } from "@/lib/validators/validators";

export async function GET(
  request: Request,
  { params }: { params: { hotelId: string } }
): Promise<NextResponse> {
  try {
    // Get hotel Id from route params.
    const { hotelId } = await params;
    
    // Validate hotel Id.
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json({ error: "Hotel Id is invalid" }, { status: 400 });
    }
    
    // Retrieve hotel details along with its room types.
    const hotelDetails = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
            amenities: true,
            pricePerNight: true,
            // Add other room type fields if needed.
          },
        },
        // Optionally include other hotel fields as needed.
      },
    });

    if (!hotelDetails) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Compute the starting price as the lowest price among room types.
    const roomTypes = hotelDetails.roomType;
    let startingPrice: number | null = null;
    if (roomTypes.length > 0) {
      startingPrice = roomTypes.reduce((min, rt) => {
        return rt.pricePerNight < min ? rt.pricePerNight : min;
      }, roomTypes[0].pricePerNight);
    }

    // Construct the result combining hotel details with computed starting price.
    const result = {
      id: hotelDetails.id,
      name: hotelDetails.name,
      address: hotelDetails.address,
      location: hotelDetails.location,
      rating: hotelDetails.rating,
      images: hotelDetails.images,
      logo: hotelDetails.logo,
      roomTypes, // Array of room type objects with id, name, amenities, and pricePerNight.
      startingPrice,
    };

    return NextResponse.json({ hotel: result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
