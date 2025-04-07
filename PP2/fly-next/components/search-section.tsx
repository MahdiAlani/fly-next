"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plane, Star, Building } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useBookings } from "@/app/bookingsContext";
import Image from "next/image";
import { HotelDetails } from "@/components/hotel-details";

export function SearchSection() {
  const { addBooking } = useBookings();
  const [date, setDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [results, setResults] = useState<any>(null); // State to store search results
  const [isLoading, setIsLoading] = useState(false);

  // Hotel search fields
  const [selectedStar, setSelectedStar] = useState<number | null>(null); // State for selected star rating
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [city, setCity] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [hotelResults, setHotelResults] = useState<any>(null);

  // Autofill suggestions
  const [fromSuggestions, setFromSuggestions] = useState<{ id: string; name: string; type: string }[]>([]);
  const [toSuggestions, setToSuggestions] = useState<{ id: string; name: string; type: string }[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Add new state for selected outbound flight
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<any>(null);

  // Add state for details modal
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch suggestions for "From" field
  useEffect(() => {
    if (from.length > 2) {
      axios
        .get(`/api/flights/autocomplete?search=${from}`)
        .then((response) => {
          setFromSuggestions(Array.isArray(response.data) ? response.data : []);
          setShowFromSuggestions(true);
        })
        .catch((error) => console.error("Error fetching 'from' suggestions:", error));
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }, [from]);

  // Fetch suggestions for "To" field
  useEffect(() => {
    if (to.length > 2) {
      axios
        .get(`/api/flights/autocomplete?search=${to}`)
        .then((response) => {
          setToSuggestions(Array.isArray(response.data) ? response.data : []);
          setShowToSuggestions(true);
        })
        .catch((error) => console.error("Error fetching 'to' suggestions:", error));
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }, [to]);

  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFromSuggestions(false);
      setShowToSuggestions(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Flight search
  const handleSearch = async () => {
    if (!from || !to || !date) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const params: any = {
        source: from,
        destination: to,
        date: format(date, "yyyy-MM-dd"),
        tripType,
      };

      if (tripType === "round-trip" && returnDate) {
        params.returnDate = format(returnDate, "yyyy-MM-dd");
      }

      const response = await axios.get("/api/flights", { params });
      setResults(response.data); // Store the API response in the results state
    } catch (error) {
      console.error("Error fetching flight data:", error);
      alert("Failed to fetch flight data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add flight to bookings
  const handleSelectFlight = (flight: any) => {
    // Format the flight details
    const departureTime = new Date(flight.departure_time);
    const arrivalTime = new Date(flight.arrival_time);

    const formattedDeparture = format(departureTime, "MMM d, yyyy h:mm a");
    const formattedArrival = format(arrivalTime, "MMM d, yyyy h:mm a");

    // Create a booking item
    const bookingItem = {
      id: `flight-${flight.id}`,
      type: "flight" as const,
      title: `${flight.origin} to ${flight.destination}`,
      details: `${formattedDeparture} • ${flight.origin} • ${flight.destination}`,
      price: flight.price,
      image: "plane",
      quantity: 1,
    };

    // Add to bookings
    addBooking(bookingItem);

    // Show confirmation
    alert(`Flight from ${flight.origin} to ${flight.destination} has been added to your bookings.`);
  };

  // Add new handler for round-trip flight selection
  const handleSelectRoundTripFlight = (flights: any) => {
    const bookingItem = {
      id: `flight-${flights.outbound.id}-${flights.return.id}`,
      type: "flight" as const,
      title: `Round-trip: ${flights.outbound.origin} ⇄ ${flights.outbound.destination}`,
      details: `Outbound: ${format(new Date(flights.outbound.departure_time), "MMM d, yyyy h:mm a")}
             Return: ${format(new Date(flights.return.departure_time), "MMM d, yyyy h:mm a")}`,
      price: flights.totalPrice,
      image: "plane",
      quantity: 1,
    };

    addBooking(bookingItem);
    alert("Round-trip flights have been added to your bookings.");
  };

  // Hotel search
  interface RoomType {
    id: string;
    name: string;
    pricePerNight: number;
    rooms: number;
  }

  interface Hotel {
    id: string;
    name: string;
    location: string;
    address: string;
    rating?: number;
    logo?: string;
    startingPrice?: number;
  }

  interface HotelSearchResponse {
    hotels: Hotel[];
  }

  const handleHotelSearch = async () => {
    try {
      const params = new URLSearchParams({
        ...(checkInDate && { checkIn: format(checkInDate, "yyyy-MM-dd") }),
        ...(checkOutDate && { checkOut: format(checkOutDate, "yyyy-MM-dd") }),
        ...(city && { city }),
        ...(hotelName && { name: hotelName }),
        ...(selectedStar && { starRating: selectedStar.toString() }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      });

      const queryString = params.toString();
      const url = queryString ? `/api/hotels/search?${queryString}` : `/api/hotels/search`;

      const response = await axios.get<HotelSearchResponse>(url);
      setHotelResults(response.data.hotels || []);
    } catch (error) {
      console.error("Error fetching hotel data:", error);
      alert("Failed to fetch hotel data. Please try again.");
    }
  };

  const handleAddHotelToBooking = (hotel: Hotel) => {
    if (!checkInDate || !checkOutDate || !hotel.startingPrice) {
      alert("Please select check-in and check-out dates");
      return;
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const bookingItem = {
      id: `hotel-${hotel.id}`,
      type: "hotel" as const,
      title: hotel.name,
      details: `${format(checkInDate, "MMM d, yyyy")} - ${format(checkOutDate, "MMM d, yyyy")} • ${hotel.location}`,
      price: hotel.startingPrice * nights,
      image: hotel.logo || "building",
      quantity: 1,
    };

    addBooking(bookingItem);
    alert("Hotel has been added to your bookings.");
  };

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <div className="bg-card rounded-lg shadow-lg p-6 -mt-24 relative z-10">
          <Tabs defaultValue="flights" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="flights" className="flex items-center gap-2">
                Flights
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                Hotels
              </TabsTrigger>
            </TabsList>

            {/* Flight search section */}
            <TabsContent value="flights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Field */}
                <div className="relative">
                  <div
                    className="flex items-center space-x-4 border rounded-md p-3"
                    onClick={(e) => e.stopPropagation()} // Prevent hiding dropdown when clicking inside
                  >
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">From</p>
                      <Input
                        className="border-0 p-0 focus-visible:ring-0 text-base"
                        placeholder="Departure city or airport"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        onFocus={() => setShowFromSuggestions(true)}
                      />
                    </div>
                  </div>
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-background border rounded-md shadow-lg mt-1 w-full max-h-40 overflow-y-auto">
                      {fromSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                          setFrom(suggestion.name);
                          setShowFromSuggestions(false);
                          }}
                        >
                          <span className="text-gray-900 dark:text-gray-100">
                          {suggestion.name}
                          </span>{" "}
                          <span className="text-gray-500 dark:text-gray-400">
                          ({suggestion.type})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* To Field */}
                <div className="relative">
                  <div
                    className="flex items-center space-x-4 border rounded-md p-3"
                    onClick={(e) => e.stopPropagation()} // Prevent hiding dropdown when clicking inside
                  >
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">To</p>
                      <Input
                        className="border-0 p-0 focus-visible:ring-0 text-base"
                        placeholder="Arrival city or airport"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        onFocus={() => setShowToSuggestions(true)}
                      />
                    </div>
                  </div>
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-background border rounded-md shadow-lg mt-1 w-full max-h-40 overflow-y-auto">
                      {toSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                          setTo(suggestion.name);
                          setShowToSuggestions(false);
                          }}
                        >
                          <span className="text-gray-900 dark:text-gray-100">
                          {suggestion.name}
                          </span>{" "}
                          <span className="text-gray-500 dark:text-gray-400">
                          ({suggestion.type})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Trip Type Toggle */}
              <div className="flex gap-4">
                <Button
                  variant={tripType === "one-way" ? "default" : "outline"}
                  onClick={() => {
                  setTripType("one-way");
                  setResults(null); // Clear search results
                  setSelectedOutboundFlight(null); // Reset outbound flight selection
                  }}
                >
                  One-Way
                </Button>
                <Button
                  variant={tripType === "round-trip" ? "default" : "outline"}
                  onClick={() => {
                  setTripType("round-trip");
                  setResults(null); // Clear search results
                  setSelectedOutboundFlight(null); // Reset outbound flight selection
                  }}
                >
                  Round-Trip
                </Button>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Departure date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date || undefined}
                      onSelect={(day) => setDate(day || null)}
                    />
                  </PopoverContent>
                </Popover>

                {tripType === "round-trip" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : "Return date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate || undefined}
                        onSelect={(day) => setReturnDate(day || null)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Search Button */}
              <div className="flex justify-center">
                <Button
                  className="bg-sky-500 hover:bg-sky-600 px-8"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search Flights"}
                </Button>
              </div>

              {/* Results Section */}
              {results && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4">
                    {tripType === "round-trip"
                      ? selectedOutboundFlight
                        ? "Select Return Flight"
                        : "Select Outbound Flight"
                      : "Available Flights"}
                  </h3>
                  <div className="space-y-4">
                    {/* Show either leaving or returning flights based on selection state */}
                    {(tripType === "round-trip" && selectedOutboundFlight
                      ? results.returning
                      : results.leaving
                    ).map((flight: any) => (
                      <div
                        key={flight.id}
                        className="border rounded-lg p-6 shadow-md bg-background flex flex-col md:flex-row items-start md:items-center gap-6"
                      >
                        {/* Flight Details */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            {/* From and To */}
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">From</p>
                              <p className="text-lg font-semibold">{flight.origin}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">To</p>
                              <p className="text-lg font-semibold">{flight.destination}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            {/* Departure and Arrival */}
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Departure</p>
                              <p className="text-base font-medium">
                                {format(new Date(flight.departure_time), "PPP p")}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Arrival</p>
                              <p className="text-base font-medium">
                                {format(new Date(flight.arrival_time), "PPP p")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="text-base font-medium">
                              {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                            </p>
                          </div>

                          {flight.layovers.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500">Layovers</p>
                              <p className="text-base font-medium">
                                {flight.layovers
                                  .map((layover: any) => layover.airport)
                                  .join(", ")}
                              </p>
                            </div>
                          )}

                          <div className="mt-4">
                              <p className="text-sm text-gray-500">Price</p>
                              <p className="text-xl font-bold text-sky-600">
                                ${flight.price}
                              </p>
                            </div>
                        </div>

                        {/* Modify the action section */}
                        <div className="flex-shrink-0">
                          <Button
                            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-md"
                            onClick={() => {
                              if (tripType === "one-way") {
                                handleSelectFlight(flight);
                              } else {
                                if (!selectedOutboundFlight) {
                                  setSelectedOutboundFlight(flight);
                                } else {
                                  // Add both flights to the booking
                                  const combinedBooking = {
                                    outbound: selectedOutboundFlight,
                                    return: flight,
                                    totalPrice: selectedOutboundFlight.price + flight.price,
                                  };
                                  handleSelectRoundTripFlight(combinedBooking);
                                  setSelectedOutboundFlight(null); // Reset selection
                                }
                              }
                            }}
                          >
                            {tripType === "round-trip"
                              ? selectedOutboundFlight
                                ? "Select Return Flight"
                                : "Select Outbound Flight"
                              : "Select Flight"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="hotels" className="space-y-6">
              <div className="space-y-6">
                {/* Hotel Search Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City Field */}
                  <div className="relative">
                    <div className="flex items-center space-x-4 border rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">City</p>
                        <Input
                          className="border-0 p-0 focus-visible:ring-0 text-base"
                          placeholder="Enter city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hotel Name Field */}
                  <div className="relative">
                    <div className="flex items-center space-x-4 border rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Hotel Name</p>
                        <Input
                          className="border-0 p-0 focus-visible:ring-0 text-base"
                          placeholder="Enter hotel name"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, "PPP") : "Check-in Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkInDate || undefined}
                        onSelect={(day) => setCheckInDate(day || null)}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, "PPP") : "Check-out Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOutDate || undefined}
                        onSelect={(day) => setCheckOutDate(day || null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Star Rating and Price Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Star Rating */}
                  <div className="relative">
                    <div className="flex flex-col space-y-2">
                      <p className="text-xs text-gray-500">Star Rating</p>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant={selectedStar === star ? "default" : "outline"}
                            className="w-10 h-10 flex items-center justify-center"
                            onClick={() =>
                              setSelectedStar((prev) => (prev === star ? null : star))
                            }
                          >
                            {star}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="relative">
                    <div className="flex flex-col space-y-2">
                      <p className="text-xs text-gray-500">Price Range</p>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="number"
                          className="w-20 border rounded-md p-2 text-base"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="number"
                          className="w-20 border rounded-md p-2 text-base"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-center">
                  <Button
                    className="bg-sky-500 hover:bg-sky-600 px-8"
                    onClick={handleHotelSearch}
                  >
                    Search Hotels
                  </Button>
                </div>

                {/* Hotel Results Section */}
                {hotelResults && (
                  <div className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold mb-4">Hotels Found</h3>
                      {hotelResults.map((hotel: Hotel) => (
                        <div key={hotel.id} 
                          className="border rounded-lg p-4 shadow-md bg-background hover:shadow-lg transition-shadow"
                        >
                          <div className="flex gap-4">
                            {/* Logo Section */}
                            <div className="flex-shrink-0">
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                {hotel.logo ? (
                                  <Image 
                                    src={hotel.logo}
                                    alt={`${hotel.name} Logo`}
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-grow flex flex-col">
                              <div className="flex justify-between items-start">
                                {/* Hotel Info */}
                                <div>
                                  <h4 className="text-xl font-semibold">{hotel.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center">
                                      {hotel.rating && [...Array(hotel.rating)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500">•</span>
                                    <p className="text-sm text-gray-600">{hotel.location}</p>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{hotel.address}</p>
                                </div>

                                {/* Price Section */}
                                <div className="text-right">
                                  {hotel.startingPrice ? (
                                    <div>
                                      <p className="text-sm text-gray-500">Starting from</p>
                                      <p className="text-xl font-bold text-sky-600">
                                        ${hotel.startingPrice}
                                        <span className="text-sm font-normal">/night</span>
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-red-500">No rooms available</p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-auto pt-4">
                                <Button 
                                  variant="default"
                                  className="bg-sky-500 hover:bg-sky-600"
                                  onClick={() => {
                                    setSelectedHotelId(hotel.id);
                                    setIsDetailsOpen(true);
                                  }}
                                >
                                  View Rooms & Rates
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {selectedHotelId && (
        <HotelDetails
          hotelId={selectedHotelId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onBookRoom={(roomType) => {
            if (!checkInDate || !checkOutDate) {
              alert("Please select check-in and check-out dates");
              return;
            }
            
            const nights = Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            const bookingItem = {
              id: `hotel-${selectedHotelId}-${roomType.id}`,
              type: "hotel" as const,
              title: `${hotelResults.find((h: Hotel) => h.id === selectedHotelId)?.name} - ${roomType.name}`,
              details: `${format(checkInDate, "MMM d, yyyy")} - ${format(checkOutDate, "MMM d, yyyy")} • ${hotelResults.find((h: Hotel) => h.id === selectedHotelId)?.location}`,
              price: roomType.pricePerNight * nights,
              image: hotelResults.find((h: Hotel) => h.id === selectedHotelId)?.logo || "building",
              quantity: 1,
            };

            addBooking(bookingItem);
            setIsDetailsOpen(false);
            alert("Room has been added to your bookings.");
          }}
        />
      )}
    </section>
  );
}