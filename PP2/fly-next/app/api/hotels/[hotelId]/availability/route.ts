import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { getDates, isValidInput } from "@/lib/validators/validators";
import { verifyHotelOwner } from "@/lib/middleware/middleware";

interface Params {
  hotelId: string;
}

export async function GET(request: Request, { params }: { params: Params }): Promise<Response> {
  try {
    // Get hotel ID from params.
    const { hotelId } = params;

    // Get query parameters from the URL.
    const url = new URL(request.url);
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");
    const roomTypeId = url.searchParams.get("roomTypeId");

    // Verify hotel owner.
    const ownerCheck = await verifyHotelOwner(request, hotelId);
    if (ownerCheck !== true) return ownerCheck;

    // Validate hotel ID.
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json({ error: "Hotel Id is invalid" }, { status: 400 });
    }

    // Check if the hotel exists.
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Get the dates.
    const { startDate, endDate } = getDates(startDateStr, endDateStr);

    // Start date must be before end date.
    if (startDate >= endDate) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // If a room type is specified, validate it.
    if (roomTypeId) {
      if (!isValidInput(roomTypeId, "string")) {
        return NextResponse.json({ error: "Room Type Id is invalid" }, { status: 400 });
      }
      const roomTypeExists = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
      if (!roomTypeExists) {
        return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
      }
    }

    // Retrieve room types for the hotel, optionally filtering by roomTypeId.
    // Include the bookings relation so we can filter overlapping dates in code.
    const roomTypes = await prisma.roomType.findMany({
      where: {
        hotelId,
        ...(roomTypeId ? { id: roomTypeId } : {}),
      },
      include: {
        bookings: true,
      },
    });

    const availability: { roomType: string; availableRooms: number }[] = [];

    // Loop through each room type.
    for (const roomType of roomTypes) {
      // Use the numeric "rooms" field to determine total rooms.
      const totalRooms = roomType.rooms;

      // Filter overlapping bookings.
      const overlappingBookings = roomType.bookings.filter((booking) => {
        // Skip if either date is missing.
        if (!booking.checkIn || !booking.checkOut) return false;
        return booking.checkIn <= endDate && booking.checkOut >= startDate;
      });

      const bookedRooms = overlappingBookings.length;
      const availableRooms = totalRooms - bookedRooms;

      availability.push({
        roomType: roomType.name,
        availableRooms,
      });
    }

    return NextResponse.json({ availability }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
