import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyHotelOwner } from "@/lib/middleware/middleware";

// Delete a booking
export async function DELETE(request: Request, { params }: { params: { hotelId: string; bookingId: string } }): Promise<NextResponse> {
  try {
    const { hotelId, bookingId } = params;

    // Verify hotel owner
    const ownerCheck = await verifyHotelOwner(request, hotelId);
    if (ownerCheck !== true) return ownerCheck;

    // Get the booking
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    // Check if booking exists
    if (!booking) {
      return NextResponse.json({ error: "Booking does not exist" }, { status: 404 });
    }

    // Delete the booking
    await prisma.booking.delete({ where: { id: bookingId } });

    return NextResponse.json({ message: "Booking deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
