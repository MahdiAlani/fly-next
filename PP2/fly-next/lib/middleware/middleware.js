import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { isValidInput } from "@/lib/validators/validators";
import {prisma} from "@/utils/db";

export function verifyToken(request) {

    // Get authorization header
    const authHeader = request.headers.get("authorization");

    // Error check authorization is provided
    if (!isValidInput(authHeader)) {
        return NextResponse.json({error: "No token provided"}, {status: 401});
    }
    // Extract token
    const token = authHeader.split(" ")[1];
    
    // Try verifying token
    try {
        
        // Verify access tokenc
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        
        // Add decoded user id to headers
        const response = NextResponse.next();
        response.headers.set("x-user-id", decoded.userID);
        // If token is valid, continue
        return response;
    }

    catch (error) {
        console.log(error)
        return NextResponse.json({error: "Invalid token"}, {status: 401});
    }
}

export async function verifyHotelOwner(request, hotelId) {
    // Verify token
    const authResponse = verifyToken(request);
    if (authResponse.status !== 200) return authResponse;
    const userID = authResponse.headers.get("x-user-id");
    console.log(hotelId)
    // Check that hotelId is valid
    if (!isValidInput(hotelId, "string") || hotelId.trim() === "") {
      return NextResponse.json({ error: "Hotel ID is not specified or invalid" }, { status: 400 });
    }
  
    // Fetch the hotel from the database
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel does not exist" }, { status: 404 });
    }
    console.log(hotel.ownerId)
    // Check ownership
    if (hotel.ownerId !== userID) {
      return NextResponse.json({ error: "Access Forbidden" }, { status: 403 });
    }
  
    // Ownership verified
    return true;
  }