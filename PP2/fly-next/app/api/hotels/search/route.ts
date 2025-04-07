import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const city = searchParams.get('city')?.toLowerCase();
  const name = searchParams.get('name')?.toLowerCase();
  const starRating = searchParams.get('starRating');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Build the hotel filter
  const hotelFilter: any = {};

  // For SQLite, we need to use lower() function for case-insensitive search
  if (city) {
    hotelFilter.location = {
      contains: city
    };
  }

  if (name) {
    hotelFilter.name = {
      contains: name
    };
  }

  if (starRating) {
    hotelFilter.rating = parseInt(starRating);
  }

  try {
    // Get all hotels with their room types
    const hotels = await prisma.hotel.findMany({
      where: hotelFilter,
      include: {
        roomType: true
      }
    });

    // Post-process the results to handle case-insensitive filtering
    const processedHotels = hotels
      .filter(hotel => {
        // Case-insensitive location/city filter
        if (city && !hotel.location.toLowerCase().includes(city)) {
          return false;
        }
        // Case-insensitive name filter
        if (name && !hotel.name.toLowerCase().includes(name)) {
          return false;
        }
        return true;
      })
      .map(hotel => {
        const availableRoomTypes = hotel.roomType.filter(room => room.rooms > 0);
        const startingPrice = availableRoomTypes.length > 0
          ? Math.min(...availableRoomTypes.map(room => room.pricePerNight))
          : null;

        // Filter by price range if specified
        if (
          (minPrice && startingPrice && startingPrice < parseInt(minPrice)) ||
          (maxPrice && startingPrice && startingPrice > parseInt(maxPrice))
        ) {
          return null;
        }

        return {
          id: hotel.id,
          name: hotel.name,
          location: hotel.location,
          address: hotel.address,
          rating: hotel.rating,
          logo: hotel.logo,
          startingPrice
        };
      })
      .filter(hotel => hotel !== null);

    return NextResponse.json({ hotels: processedHotels });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search hotels' }, { status: 500 });
  }
}
