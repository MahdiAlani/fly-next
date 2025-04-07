import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isValidInput, isValidDate } from "@/lib/validators/validators";
import { verifyToken } from "@/lib/middleware/middleware";
import { BookingStatus } from "@prisma/client";
import { CreateFlightBookingRequestBody } from "../types/booking";

const apiUrl = "https://advanced-flights-system.replit.app/api/flights";

// GET endpoint: Search flights
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    let source: string | null = searchParams.get("source");
    let destination: string | null = searchParams.get("destination");
    const date: string | null = searchParams.get("date"); // Start date of the flight
    const returnDate: string | null = searchParams.get("returnDate"); // Return date for round-trip
    const tripType: string | null = searchParams.get("tripType"); // "one-way" or "round-trip"

    // Validate source and destination
    if (!isValidInput(source, "string")) {
      return NextResponse.json({ error: "Source is invalid" }, { status: 400 });
    }
    if (!isValidInput(destination, "string")) {
      return NextResponse.json({ error: "Destination is invalid" }, { status: 400 });
    }

    // Validate date
    if (date && !isValidDate(date)) {
      return NextResponse.json({ error: "Date is invalid" }, { status: 400 });
    }
    if (returnDate && !isValidDate(returnDate)) {
      return NextResponse.json({ error: "Return date is invalid" }, { status: 400 });
    }
    if (
      !isValidInput(tripType, "string") ||
      !(tripType === "one-way" || tripType === "round-trip")
    ) {
      return NextResponse.json(
        { error: "tripType must be either one-way or round-trip" },
        { status: 400 }
      );
    }
    if (tripType === "round-trip" && !isValidInput(returnDate, "string")) {
      return NextResponse.json({ error: "Return date is invalid" }, { status: 400 });
    }

    // Check if source was given as an airport name.
    const originAirport = await prisma.airport.findFirst({
      where: { name: source! },
    });
    let originAirportName = "";
    if (originAirport) {
      originAirportName = source!;
      // Replace source with the city associated with that airport.
      source = originAirport.city;
    }

    // Check if destination was given as an airport name.
    const destinationAirport = await prisma.airport.findFirst({
      where: { name: destination! },
    });
    let destinationAirportName = "";
    if (destinationAirport) {
      destinationAirportName = destination!;
      destination = destinationAirport.city;
    }

    // Construct query parameters for the leaving flight plans.
    let queryParams = new URLSearchParams({
      origin: source!,
      destination: destination!,
      date: date!,
    });

    const leavingPlans = await getFlightPlans(
      queryParams,
      originAirportName,
      destinationAirportName
    );

    if (leavingPlans.length === 0) {
      return NextResponse.json({ error: "No flight plans could be found" }, { status: 404 });
    }

    let returningPlans: any[] = [];
    if (tripType === "round-trip") {
      queryParams = new URLSearchParams({
        origin: destination!,
        destination: source!,
        date: returnDate!,
      });

      returningPlans = await getFlightPlans(
        queryParams,
        destinationAirportName,
        originAirportName
      );

      if (returningPlans.length === 0) {
        return NextResponse.json(
          { error: "No returning flight plans could be found" },
          { status: 404 }
        );
      }
    }

    const plans = {
      leaving: leavingPlans,
      returning: returningPlans,
    };

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * Helper function to get flight plans for the given query parameters.
 */
async function getFlightPlans(queryParams: URLSearchParams, originAirportName: string, destinationAirportName: string): Promise<any[]> {
  const url = `${apiUrl}?${queryParams.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": process.env.AFS_KEY || "",
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200) {
    return [];
  }

  const data = await response.json();
  const flightPlans: any[] = [];

  for (let i = 0; i < data.results.length; i++) {
    const flights = data.results[i].flights;
    const layovers: { id: string; airport: string; price: number}[] = [];

    let totalPrice = 0;

    for (let j = 1; j < flights.length; j++) {
      const layover = flights[j];
      layovers.push({
        id: layover.id,
        airport: layover.origin.name,
        price: layover.price,
      });
      totalPrice += layover.price;
    }

    const firstFlightInfo = flights[0];

    if (originAirportName !== "" && originAirportName !== firstFlightInfo.origin.name) {
      continue;
    }
    if (
      destinationAirportName !== "" &&
      destinationAirportName !== flights[flights.length - 1].destination.name
    ) {
      continue;
    }

    const arrivalTime = flights[flights.length - 1].arrivalTime;
    const destinationName = flights[flights.length - 1].destination.name;
    const totalDuration = (new Date(arrivalTime).getTime() - new Date(firstFlightInfo.departureTime).getTime()) / (1000 * 60);

    totalPrice += firstFlightInfo.price;

    flightPlans.push({
      id: firstFlightInfo.id,
      departure_time: firstFlightInfo.departureTime,
      arrival_time: arrivalTime,
      origin: firstFlightInfo.origin.name,
      destination: destinationName,
      duration: totalDuration,
      price: totalPrice,
      layovers,
    });
  }

  return flightPlans;
}

async function getFlightById(flightId: string): Promise<any | null> {
  const url = `${apiUrl}/${flightId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": process.env.AFS_KEY || "",
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) return null;
  const data = await response.json();
  return data;
}

// POST endpoint: Create a new flight booking
export async function POST(request: Request): Promise<NextResponse> {
  try {

    // Parse request body as CreateFlightBookingRequestBody.
    const body: CreateFlightBookingRequestBody = await request.json();

    // Validate required fields.
    if (!isValidInput(body.flightId, "string")) {
      return NextResponse.json({ error: "Flight Id is invalid" }, { status: 400 });
    }

    // Use helper method to check if the flight exists.
    const flightData = await getFlightById(body.flightId);
    if (!flightData) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // Create the flight booking.
    const flightBooking = await prisma.booking.create({
      data: {
        user: { connect: { id: body.userId } },
        flightId: body.flightId,
        status: BookingStatus.PENDING,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ flightBooking }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}