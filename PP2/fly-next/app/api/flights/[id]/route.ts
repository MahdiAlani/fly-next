import { NextResponse } from "next/server";
import { isValidInput } from "@/lib/validators/validators";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { id } = params;
  
    try {
      // Validate flight id
      if (!isValidInput(id, "string")) {
        return NextResponse.json({ error: "Flight ID not specified" }, { status: 400 });
      }
  
      // Construct the API URL
      const apiUrl = `https://advanced-flights-system.replit.app/api/flights/${id}`;
  
      // Perform the API request.
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-api-key": process.env.AFS_KEY || "",
          "Content-Type": "application/json",
        },
      });
  
      // Check response
      if (response.status !== 200) {
        return NextResponse.json(
          { error: "Could not find the specified flight, please check your search parameters" },
          { status: 400 }
        );
      }
  
      const data = await response.json();
      return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  }