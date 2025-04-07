// Interface for the flight information returned by the flights API.
export interface FlightInfo {
    id: string;
    price: number;
}
  
  // Interface for the flight API response.
export interface FlightApiResponse {
    flights: FlightInfo[];
}

// Example: @/app/api/types/booking.ts
export interface CreateHotelBookingRequestBody {
  userId: string
  roomTypeId: string;
  checkIn: string; // ISO date string expected.
  checkOut: string; // ISO date string expected.
}

export interface CreateFlightBookingRequestBody {
  userId: string
  flightId: string;
  passportNumber: string;
}

export interface CreateItineraryBody {
  roomTypeIds: Array<string>
  checkIn: string
  checkOut: string
  flightIds: Array<string>
  passportNumber: string
  paymentInfo?: any;
}
