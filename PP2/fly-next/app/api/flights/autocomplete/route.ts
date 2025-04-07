import { NextResponse } from "next/server";
import { isValidInput } from "@/lib/validators/validators";
import { prisma } from "@/utils/db";

// Endpoint: /api/flights/autocomplete
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get URL and extract search parameters
    const { searchParams } = new URL(request.url);
    const search: string | null = searchParams.get("search");

    // Validate search term; return error if null or invalid.
    if (!search || !isValidInput(search, "string")) {
      return NextResponse.json({ error: "Search is invalid" }, { status: 400 });
    }

    // Now that we've validated it, assert search is a string.
    const validSearch: string = search;

    // Get all matching cities and airports
    const [cities, airports] = await Promise.all([
      prisma.city.findMany({
        where: {
          city: { contains: validSearch },
        },
        select: { id: true, city: true },
      }),
      prisma.airport.findMany({
        where: {
          name: { contains: validSearch },
        },
        select: { id: true, name: true },
      }),
    ]);

    // Format cities and airports into a unified structure.
    const formattedCities = cities.map((city) => ({
      id: city.id,
      name: city.city,
      type: "city",
    }));

    const formattedAirports = airports.map((airport) => ({
      id: airport.id,
      name: airport.name,
      type: "airport",
    }));

    const merged = [...formattedCities, ...formattedAirports];

    return NextResponse.json(merged, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
