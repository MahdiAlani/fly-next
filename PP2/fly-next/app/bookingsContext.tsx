"use client";

import React, { createContext, useContext, useState } from "react";

interface Booking {
  id: string;
  type: "flight" | "hotel";
  title: string;
  details: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ItineraryGroup {
  id: string; // Unique ID for the group
  date: string; // Date of checkout
  bookings: Booking[]; // Bookings in this group
}

interface BookingsContextType {
  bookings: Booking[];
  itinerary: ItineraryGroup[];
  addBooking: (booking: Booking) => void;
  removeBooking: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearBookings: () => void;
  addToItinerary: (bookings: Booking[]) => void;
  removeFromItinerary: (groupId: string, bookingId: string) => void;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryGroup[]>([]);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => {
      const existingBooking = prev.find((b) => b.id === booking.id);
      if (existingBooking) {
        return prev.map((b) =>
          b.id === booking.id ? { ...b, quantity: b.quantity + 1 } : b
        );
      }
      return [...prev, { ...booking, quantity: 1 }];
    });
  };

  const removeBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, quantity: Math.max(1, b.quantity + delta) } : b
      )
    );
  };

  const clearBookings = () => {
    setBookings([]);
  };

  // const createBookingItem = (flight: any, formattedDeparture: string) => {
  //   return {
  //     id: `flight-${flight.id}`, // or `hotel-${hotel.id}`
  //     type: "flight", // Use "flight" or "hotel" to differentiate
  //     title: `${flight.origin} to ${flight.destination}`, // or hotel name
  //     details: `From: ${flight.origin} • To: ${flight.destination} • Departure: ${flight.departure_time}`, // or hotel details
  //     price: flight.price, // or hotel price
  //     image: "plane", // or "hotel" for hotel bookings
  //     quantity: 1,
  //   };

  const addToItinerary = (bookingsToAdd: Booking[]) => {
    const newGroup: ItineraryGroup = {
      id: `group-${Date.now()}`, // Unique ID for the group
      date: new Date().toLocaleString(), // Current date and time
      bookings: bookingsToAdd,
    };
    setItinerary((prev) => [...prev, newGroup]);
  };

  const removeFromItinerary = (groupId: string, bookingId: string) => {
    setItinerary((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, bookings: group.bookings.filter((b) => b.id !== bookingId) }
          : group
      ).filter((group) => group.bookings.length > 0) // Remove empty groups
    );
  };

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        itinerary,
        addBooking,
        removeBooking,
        updateQuantity,
        clearBookings,
        addToItinerary,
        removeFromItinerary,
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error("useBookings must be used within a BookingsProvider");
  }
  return context;
};