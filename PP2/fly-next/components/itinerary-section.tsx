"use client";

import React from "react";
import { useBookings } from "@/app/bookingsContext";
import { Separator } from "@/components/ui/separator";
import { Plane, Trash } from "lucide-react";

export function ItinerarySection() {
  const { itinerary, removeFromItinerary } = useBookings();

  if (itinerary.length === 0) {
    return null; // Don't render the section if there are no bookings in the itinerary
  }

  return (
    <section className="bg-background py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-bold mb-4">Your Itinerary</h2>
        {itinerary.map((group) => (
          <div key={group.id} className="mb-6">
            <h3 className="text-md font-semibold mb-2">
              Checkout Date: {group.date}
            </h3>
            <div className="space-y-4">
              {group.bookings.map((booking) => (
                <div key={booking.id} className="p-4 border rounded-lg flex gap-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted">
                    {booking.image === "plane" ? (
                      <Plane className="h-full w-full text-muted-foreground p-2" />
                    ) : (
                      <img
                        src={booking.image}
                        alt={booking.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{booking.title}</h3>
                    <p className="text-xs text-muted-foreground">{booking.details}</p>
                    <p className="text-sm font-medium mt-1">
                      Total: ${booking.price.toFixed(2)} x {booking.quantity} = $
                      {(booking.price * booking.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromItinerary(group.id, booking.id)}
                    className="flex items-center justify-center p-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                    aria-label="Remove from itinerary"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
          </div>
        ))}
      </div>
    </section>
  );
}