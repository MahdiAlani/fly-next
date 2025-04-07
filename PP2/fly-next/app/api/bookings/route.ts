import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getDates, isValidInput } from "@/lib/validators/validators";
import { verifyToken } from "@/lib/middleware/middleware";
import { BookingStatus } from "@prisma/client";
import { CreateItineraryBody } from "@/app/api/types/booking";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";

// Composite itinerary endpoint: Books multiple hotel and flight bookings and creates an itinerary in an all-or-nothing fashion.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify token and extract authenticated user ID.
    const authResponse = verifyToken(request);
    if (authResponse.status !== 200) return authResponse;
    const tokenUserId = authResponse.headers.get("x-user-id");
    if (!tokenUserId) {
      return NextResponse.json({ error: "User Id is invalid" }, { status: 400 });
    }

    // Parse request body as CreateItineraryBody.
    const body: CreateItineraryBody = await request.json();

    // Validate required fields.
    if (
      !body.roomTypeIds || body.roomTypeIds.length === 0 ||
      !isValidInput(body.checkIn, "string") ||
      !isValidInput(body.checkOut, "string") ||
      !body.flightIds || body.flightIds.length === 0 ||
      !isValidInput(body.passportNumber, "string")
    ) {
      return NextResponse.json({ error: "Missing or invalid booking details" }, { status: 400 });
    }

    // Validate that paymentInfo looks correct.
    if (
      !body.paymentInfo ||
      typeof body.paymentInfo.cardNumber !== "string" ||
      typeof body.paymentInfo.expiry !== "string" ||
      typeof body.paymentInfo.cvv !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payment Info" }, { status: 400 });
    }

    let hotelBookingResults: Array<{ id: string; price: number }> = [];
    let flightBookingResults: Array<{ id: string; price: number }> = [];
    let totalPrice = 0;

    // Process hotel bookings for each roomTypeId.
    for (const roomTypeId of body.roomTypeIds) {
      // Look up the roomType so we can derive the hotelId.
      const roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
      });
      if (!roomType) {
        return NextResponse.json({ error: `Room type with Id ${roomTypeId} does not exist` }, { status: 404 });
      }

      const hotelBookingResponse = await fetch(
        `${BASE_URL}/hotels/${roomType.hotelId}/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: tokenUserId,
            roomTypeId: roomTypeId,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            paymentInfo: body.paymentInfo,
          }),
        }
      );
      if (!hotelBookingResponse.ok) {
        return NextResponse.json({ error: "Hotel booking failed" }, { status: hotelBookingResponse.status });
      }
      const hotelData = await hotelBookingResponse.json();
      if (hotelData.booking) {
        hotelBookingResults.push({
          id: hotelData.booking.id,
          price: hotelData.booking.price || 0,
        });
        totalPrice += hotelData.booking.price || 0;
      }
    }

    // Process flight bookings for each flight ID.
    for (const flightId of body.flightIds) {
      const flightBookingResponse = await fetch(`${BASE_URL}/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tokenUserId,
          flightId,
          passportNumber: body.passportNumber,
          paymentInfo: body.paymentInfo,
        }),
      });
      if (!flightBookingResponse.ok) {
        return NextResponse.json({ error: "Flight booking failed" }, { status: flightBookingResponse.status });
      }
      const flightData = await flightBookingResponse.json();
      if (flightData.flightBooking) {
        flightBookingResults.push({
          id: flightData.flightBooking.id,
          price: flightData.flightBooking.price || 0,
        });
        totalPrice += flightData.flightBooking.price || 0;
      }
    }

    // Ensure all bookings were created.
    if (
      hotelBookingResults.length !== body.roomTypeIds.length ||
      flightBookingResults.length !== body.flightIds.length
    ) {
      return NextResponse.json({ error: "One or more bookings failed" }, { status: 400 });
    }

    const bookingIds = [
      ...hotelBookingResults.map(b => b.id),
      ...flightBookingResults.map(b => b.id),
    ];

    // Create the itinerary and update the bookings within a transaction.
    const itinerary = await prisma.$transaction(async (tx) => {
      const itin = await tx.itinerary.create({
        data: {
          user: { connect: { id: tokenUserId } },
          totalPrice,
          paymentInfo: body.paymentInfo || {},
        },
        include: { bookings: true, user: true },
      });
      // Update the bookings to set their itineraryId and mark them CONFIRMED.
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { itineraryId: itin.id, status: BookingStatus.CONFIRMED },
      });
      return itin;
    });

    // Return the complete itinerary.
    const completeItinerary = await prisma.itinerary.findUnique({
      where: { id: itinerary.id },
      include: { bookings: true, user: true },
    });
    return NextResponse.json(completeItinerary, { status: 200 });
  } catch (error: any) {
    console.error("Composite itinerary error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
