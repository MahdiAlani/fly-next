"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import axios from "axios";

interface RoomType {
  id: string;
  name: string;
  amenities: string[];
  pricePerNight: number;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  location: string;
  rating: number;
  images: string[];
  logo: string;
  roomTypes: RoomType[];
  startingPrice: number;
}

interface HotelDetailsProps {
  hotelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookRoom?: (roomType: RoomType) => void;
}

export function HotelDetails({ hotelId, open, onOpenChange, onBookRoom }: HotelDetailsProps) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      if (!open) return;

      setIsLoading(true);
      try {
        const response = await axios.get<{ hotel: Hotel }>(`/api/hotels/search/${hotelId}`);
        setHotel(response.data.hotel);
        if (response.data.hotel.images.length > 0) {
          setActiveImage(response.data.hotel.images[0]);
        }
      } catch (error) {
        console.error("Error fetching hotel details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (hotelId) {
      fetchHotelDetails();
    }
  }, [hotelId, open]);

  if (!hotel && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{hotel?.name || "Loading..."}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <p>Loading hotel details...</p>
          </div>
        ) : hotel && (
          <div className="flex flex-col h-full">
            {/* Header Section - Fixed */}
            <div className="space-y-6">
              {/* Hotel Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{hotel.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[...Array(hotel.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{hotel.address}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-2xl font-bold text-sky-600">
                    ${hotel.startingPrice}
                    <span className="text-sm font-normal">/night</span>
                  </p>
                </div>
              </div>

              {/* Main Image Gallery - Fixed height */}
              <div className="space-y-4">
                {activeImage && (
                  <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
                    <Image
                      src={activeImage}
                      alt="Hotel"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {hotel.images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 
                        ${activeImage === image ? "ring-2 ring-sky-500" : ""}`}
                      onClick={() => setActiveImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`Hotel image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Types Section - Scrollable */}
            <ScrollArea className="flex-1 mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold sticky top-0 bg-background py-2">Available Rooms</h3>
                {hotel.roomTypes.map((roomType) => (
                  <div
                    key={roomType.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">{roomType.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {roomType.amenities.map((amenity, index) => (
                            <div
                              key={index}
                              className="bg-sky-50 text-sky-700 px-2 py-1 rounded-full text-sm"
                            >
                              {amenity}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-sky-600">
                          ${roomType.pricePerNight}
                          <span className="text-sm font-normal">/night</span>
                        </p>
                        <Button
                          className="mt-2 bg-sky-500 hover:bg-sky-600"
                          onClick={() => onBookRoom?.(roomType)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}