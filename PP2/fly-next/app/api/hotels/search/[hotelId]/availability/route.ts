import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { getDates, isValidInput } from "@/lib/validators/validators";

export async function GET(
  request: Request,
  { params }: { params: { hotelId: string } }
): Promise<NextResponse> {
  try {
    // Get hotel Id from route params.
    const { hotelId } = params;

    // Validate hotel Id.
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json({ error: "Hotel Id is invalid" }, { status: 400 });
    }

    // Check if hotel exists.
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Get query parameters from the URL.
    const url = new URL(request.url);
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");
    const roomTypeId = url.searchParams.get("roomTypeId");

    // Get the dates (defaults: startDate defaults to Unix epoch, endDate to now)
    const { startDate, endDate } = getDates(startDateStr, endDateStr);

    // Ensure startDate is before endDate.
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Build a filter for room types for this hotel.
    const roomTypeFilter: { hotelId: string; id?: string } = { hotelId };
    if (roomTypeId) {
      if (!isValidInput(roomTypeId, "string")) {
        return NextResponse.json({ error: "Room Type Id is invalid" }, { status: 400 });
      }
      // Verify that the specified room type exists.
      const roomTypeExists = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
      if (!roomTypeExists) {
        return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
      }
      roomTypeFilter.id = roomTypeId;
    }

    // Get the room types for the hotel (optionally filtered by roomTypeId).
    const roomTypes = await prisma.roomType.findMany({
      where: roomTypeFilter,
    });

    // For each room type, compute available rooms as: total rooms (roomType.rooms) minus overlapping bookings.
    const roomTypesAndAvailability = await Promise.all(
      roomTypes.map(async (roomType) => {
        const totalRooms: number = roomType.rooms; // total inventory stored on RoomType
        const overlappingBookings = await prisma.booking.count({
          where: {
            roomTypeId: roomType.id,
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
        });
        const availableRooms = totalRooms - overlappingBookings;
        return {
          ...roomType,
          availableRooms,
        };
      })
    );

    return NextResponse.json({ roomTypesAndAvailability }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
