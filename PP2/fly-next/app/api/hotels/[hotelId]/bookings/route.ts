import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getDates, isValidInput } from "@/lib/validators/validators";
import { verifyHotelOwner, verifyToken } from "@/lib/middleware/middleware";
import { BookingStatus } from "@prisma/client";
import { CreateHotelBookingRequestBody } from "@/app/api/types/booking";

interface Params {
  hotelId: string;
}

// GET endpoint: Filter bookings for a hotel
export async function GET(request: Request,{ params }: { params: Params }): Promise<NextResponse> {
  try {
    const { hotelId } = await params;

    // Get search parameters from the URL
    const url = new URL(request.url);
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");
    const roomTypeId = url.searchParams.get("roomTypeId");

    // Verify hotel owner
    const ownerCheck = await verifyHotelOwner(request, hotelId);
    if (ownerCheck !== true) return ownerCheck;

    // Validate hotel Id
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json({ error: "Hotel Id is invalid" }, { status: 400 });
    }
    // Check if hotel exists
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Build the filter.
    const where: any = {
      roomType: { hotelId },
    };

    if (startDateStr || endDateStr) {
      const { startDate, endDate } = getDates(startDateStr, endDateStr);
      if (endDate.getTime() - startDate.getTime() < 0) {
        return NextResponse.json({ error: "Start date is after end date" }, { status: 400 });
      }
      where.checkIn = { lte: endDate };
      where.checkOut = { gte: startDate };
    }

    if (roomTypeId) {
      if (!isValidInput(roomTypeId, "string")) {
        return NextResponse.json({ error: "Room Type Id is invalid" }, { status: 400 });
      }
      const roomTypeExists = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
      if (!roomTypeExists) {
        return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
      }
      where.roomType = { ...where.roomType, id: roomTypeId };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        roomType: true,
        user: true,
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST endpoint: Create a new hotel booking (only if available rooms exist)
export async function POST(request: Request, { params }: { params: Params }): Promise<NextResponse> {
  try {
    const { hotelId } = await params;

    // Validate hotelId and check that the hotel exists.
    if (!isValidInput(hotelId, "string")) {
      return NextResponse.json({ error: "Hotel Id is invalid" }, { status: 400 });
    }
    const hotelExists = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotelExists) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Parse the request body as CreateBookingRequestBody.
    const body: CreateHotelBookingRequestBody = await request.json();

    if (!body.userId) {
      return NextResponse.json({ error: "User Id is invalid" }, { status: 400 });
    }

    // Validate required fields from the request body.
    if (!isValidInput(body.roomTypeId, "string")) {
      return NextResponse.json({ error: "Room Type Id is invalid" }, { status: 400 });
    }
    if (!isValidInput(body.checkIn, "string") || !isValidInput(body.checkOut, "string")) {
      return NextResponse.json({ error: "Invalid check-in/out dates" }, { status: 400 });
    }

    // Parse check-in and check-out dates.
    const { startDate: checkIn, endDate: checkOut } = getDates(body.checkIn, body.checkOut);
    if (checkOut.getTime() - checkIn.getTime() < 0) {
      return NextResponse.json({ error: "Check-in date is after check-out date" }, { status: 400 });
    }

    // Check that the room type exists and belongs to the hotel.
    const roomType = await prisma.roomType.findUnique({ where: { id: body.roomTypeId } });
    if (!roomType || roomType.hotelId !== hotelId) {
      return NextResponse.json(
        { error: "Room Type does not exist or does not belong to the hotel" },
        { status: 404 }
      );
    }

    // Check for overlapping bookings during the requested date range.
    const overlappingCount = await prisma.booking.count({
      where: {
        roomTypeId: body.roomTypeId,
        checkIn: { lte: checkOut },
        checkOut: { gte: checkIn },
      },
    });
    const availableRooms = roomType.rooms - overlappingCount;
    if (availableRooms < 1) {
      return NextResponse.json({ error: "No available rooms for the selected dates" }, { status: 400 });
    }

    // Check that the authenticated user actually exists in the database.
    const userExists = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    // Calculate the total price.
    const price = roomType.pricePerNight * nights;

    // Create the booking.
    const booking = await prisma.booking.create({
      data: {
        roomType: { connect: { id: body.roomTypeId } },
        user: { connect: { id: body.userId } },
        checkIn,
        checkOut,
        status: BookingStatus.PENDING,
        hotel: { connect: { id: hotelId } },
        price
      },
      include: {
        roomType: true,
        user: true,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
      console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
