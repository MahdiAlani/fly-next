import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isValidInput } from "@/lib/validators/validators";
import { verifyHotelOwner } from "@/lib/middleware/middleware";

/**
 * GET /api/hotels/[hotelId]/room-types/[roomTypeId]
 * Returns the available inventory for a given room type.
 */
export async function GET(
  request: Request,
  { params }: { params: { hotelId: string; roomTypeId: string } }
): Promise<NextResponse> {
  try {
    const { hotelId, roomTypeId } = params;

    // Validate inputs
    if (!isValidInput(hotelId, "string") || !isValidInput(roomTypeId, "string")) {
      return NextResponse.json({ error: "Hotel Id or Room Type Id is invalid" }, { status: 400 });
    }

    // Verify hotel owner
    const ownerCheck = await verifyHotelOwner(request, hotelId);
    if (ownerCheck !== true) return ownerCheck;

    // Ensure the hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Get the room type (inventory is stored as a number in the 'rooms' field)
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) {
      return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
    }

    return NextResponse.json({ inventory: roomType.rooms }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * PATCH /api/hotels/[hotelId]/room-types/[roomTypeId]
 * Reduces the available inventory for a room type and cancels excess future bookings if needed.
 * Expects { removeCount: number } in the request body.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { hotelId: string; roomTypeId: string } }
): Promise<NextResponse> {
  try {
    const { hotelId, roomTypeId } = params;
    const { removeCount } = await request.json();

    // Validate inputs
    if (!isValidInput(hotelId, "string") || !isValidInput(roomTypeId, "string")) {
      return NextResponse.json({ error: "Hotel Id or Room Type Id is invalid" }, { status: 400 });
    }
    if (typeof removeCount !== "number" || removeCount < 0) {
      return NextResponse.json({ error: "Remove count must be a positive number" }, { status: 400 });
    }

    // Ensure the hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Ensure the room type exists
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) {
      return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
    }

    // Check that the room type belongs to this hotel
    if (roomType.hotelId !== hotel.id) {
      return NextResponse.json({ error: "Room Type does not belong to this hotel" }, { status: 400 });
    }

    const currentInventory = roomType.rooms;
    if (removeCount > currentInventory) {
      return NextResponse.json({ error: "Not enough rooms in inventory" }, { status: 400 });
    }

    const newInventory = currentInventory - removeCount;

    // Update the inventory count in the room type record
    await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { rooms: newInventory },
    });

    // Cancel excess future bookings if necessary.
    // (Assumes that bookings reference roomType and have a checkIn date.)
    const now = new Date();
    const futureBookings = await prisma.booking.findMany({
      where: {
        roomTypeId,
        checkIn: { gte: now },
      },
      orderBy: { checkIn: "asc" },
    });

    let cancelledBookingIds: string[] = [];
    // If more future bookings exist than the new inventory allows, cancel the extra bookings.
    if (futureBookings.length > newInventory) {
      const numToCancel = futureBookings.length - newInventory;
      // Cancel bookings with the latest checkIn dates (you may choose a different strategy as needed)
      const bookingsToCancel = futureBookings.slice(-numToCancel);
      for (const booking of bookingsToCancel) {
        await prisma.booking.delete({ where: { id: booking.id } });
        cancelledBookingIds.push(booking.id);
      }
    }

    return NextResponse.json(
      { message: "Room availability successfully changed", newInventory, cancelledBookingIds },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * POST /api/hotels/[hotelId]/room-types/[roomTypeId]
 * Increases the available inventory for a room type.
 * Expects { roomsToAdd: number } in the request body.
 */
export async function POST(
  request: Request,
  { params }: { params: { hotelId: string; roomTypeId: string } }
): Promise<NextResponse> {
  try {
    const { hotelId, roomTypeId } = params;
    const { roomsToAdd } = await request.json();

    // Validate inputs
    if (!isValidInput(hotelId, "string") || !isValidInput(roomTypeId, "string")) {
      return NextResponse.json({ error: "Hotel or Room Type Id is invalid" }, { status: 400 });
    }
    if (typeof roomsToAdd !== "number" || roomsToAdd <= 0) {
      return NextResponse.json({ error: "Rooms to add must be a positive number" }, { status: 400 });
    }

    // Ensure the hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }

    // Ensure the room type exists
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) {
      return NextResponse.json({ error: "Room Type does not exist" }, { status: 404 });
    }

    // Check that the room type belongs to this hotel
    if (roomType.hotelId !== hotel.id) {
      return NextResponse.json({ error: "Room Type does not belong to this hotel" }, { status: 400 });
    }

    // Increase the inventory count by updating the roomType record
    const newInventory = roomType.rooms + roomsToAdd;
    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { rooms: newInventory },
    });

    return NextResponse.json(
      { message: "Rooms added successfully", newInventory: updatedRoomType.rooms },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
