import { prisma } from "@/utils/db";
import { isValidCardNumber, isValidExpiry, isValidCVV } from "@/utils/validateCard";

export async function GET(request, { params }) {
    const { id } = params;

    // Retrieving hotel data
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { hotel: true },
        });

        if (!booking) {
        return Response.json({ error: "Booking not found" }, { status: 404 });
        }

        // Retrieving flight data
        let flightData = null;
        if (booking.flightId) {
            const flightResponse = await fetch(`/api/flights/[booking.flightId]`);

            if (flightResponse.ok) {
                flightData = await flightResponse.json();
            }
        }

        const responseData = {
            id: booking.id,
            status: booking.status,
            price: booking.price?.toFixed(2) ?? 'Not available',
            createdAt: booking.createdAt,
            checkIn: booking.checkIn ?? 'Check-in date not available',
            checkOut: booking.checkOut ?? 'Check-in date not available',

            // Hotel data
            hotel: booking.hotel 
            ? {
                name: booking.hotel.name,
                logo: booking.hotel?.logo ?? 'fly-next\public\globe.svg',
                address: booking.hotel.address,
                location: booking.hotel.location,
                rating: booking.hotel?.rating.toFixed(2) ?? 'Not Available',
            } : null,
            
            // Flight data
            flight: flightData ? {
                airline: flightData.airline.name,
                flightNumber: flightData.flightNumer,
                departureTime: flightData.departureTime,
                arrivalTime: flightData.arrivalTime,
                duration: flightData.duration,
                price: flightData.price,
                status: flightData.status,
                origin: flightData.origin.country,
                destination: flightData.destination.country,
            } : null,
        }

        return Response.json(booking, { status: 200 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// Finalize Booking
export async function POST(request) {
    const { bookingId, cardNumber, expiry, cvv } = await request.json();

    // Validate card details
    if (!isValidCardNumber(cardNumber)) {
        return Response.json({ error: 'Invalid card number' }, { status: 400 });
    }

    if (!isValidExpiry(expiry)) {
        return Response.json({ error: 'Invalid expiry date' }, { status: 400 });
    }

    if (!isValidCVV(cvv)) {
        return Response.json({ error: 'Invalid CVV' }, { status: 400 });
    }

    // Confirming booking
    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
    });

    return Response.json(updatedBooking, { status: 200 });
}


export async function PATCH(req) {
    const { bookingId } = await req.json();

    if (!bookingId) {
        return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { flight: true }
    });

    if (booking.flightId) {
        const flightResponse = await fetch(
            `https://advanced-flights-system.replit.app/api/flights/${booking.flightId}`,
            {
                headers: {
                    'x-api-key': process.env.AFS_KEY,
                },
            }
        );

        const flightData = await flightResponse.json();

        if (flightData.status === 'CANCELLED') {
            await prisma.booking.update({
                where: { id: bookingId },
                data: { status: BookingStatus.CANCELLED },
            });

            return Response.json({ message: 'Booking cancelled due to flight cancellation' }, { status: 200 });
        }
    }

    return Response.json({ message: 'Flight is still active' }, { status: 400 });
}