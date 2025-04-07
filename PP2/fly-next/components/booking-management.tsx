import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"
import axios from "axios"

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  roomType: string;
  guestName: string;
  hotelId: string;
  hotelName: string;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  location: string;
  rating: number;
}

interface RoomType {
  id: string;
  name: string;
  hotelId: string;
}

interface BookingManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingManagement({ open, onOpenChange }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [hotels, setHotels] = useState<Array<{ id: string; name: string }>>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roomType: 'all', // Changed from empty string to 'all'
    hotelId: 'all'
  })

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) throw new Error("Access token missing")

        const response = await axios.get<{hotels: Array<Hotel>}>('/api/hotels/', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        setHotels(response.data.hotels)
      } catch (error) {
        console.error('Error fetching hotels:', error)
      }
    }

    if (open) {
      fetchHotels()
    }
  }, [open])

  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!filters.hotelId || filters.hotelId === 'all') {
        setRoomTypes([]);
        return;
      }

      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Access token missing");

        const response = await axios.get<{ roomTypes: RoomType[] }>(
          `/api/hotels/${filters.hotelId}/room-types`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        setRoomTypes(response.data.roomTypes);
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };

    fetchRoomTypes();
  }, [filters.hotelId]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!hotels.length) return;
      
      setIsLoading(true)
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) throw new Error("Access token missing")

        const bookingPromises = hotels.map(hotel => {
          let url = `/api/hotels/${hotel.id}/bookings?`
          const params = new URLSearchParams()
          if (filters.startDate) params.append('startDate', filters.startDate)
          if (filters.endDate) params.append('endDate', filters.endDate)
          if (filters.roomType) params.append('roomType', filters.roomType)
          
          return axios.get<{ bookings: Array<Booking> }>(`${url}${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        })

        const responses = await Promise.all(bookingPromises)
        const allBookings = responses.flatMap((response, index) => 
          response.data.bookings.map((booking: Booking) => ({
            ...booking,
            hotelName: hotels[index].name,
            hotelId: hotels[index].id
          }))
        )
        setBookings(allBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchBookings()
    }
  }, [open, hotels, filters])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Booking Management</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="hotel">Hotel</Label>
            <Select 
              value={filters.hotelId} 
              onValueChange={(value) => {
                setFilters({ 
                  ...filters, 
                  hotelId: value,
                  roomType: 'all' // Changed from empty string to 'all'
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hotels</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="roomType">Room Type</Label>
            <Select
              value={filters.roomType}
              onValueChange={(value) => setFilters({ ...filters, roomType: value })}
              disabled={!filters.hotelId || filters.hotelId === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {roomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.name}>
                    {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No bookings found.</div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {bookings
              .filter(booking => filters.hotelId === "all" || booking.hotelId === filters.hotelId)
              .filter(booking => filters.roomType === "all" || booking.roomType.toLowerCase().includes(filters.roomType.toLowerCase()))
              .map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{booking.guestName}</h3>
                      <p className="text-sm text-gray-500">Hotel: {booking.hotelName}</p>
                      <p className="text-sm">Room Type: {booking.roomType}</p>
                      <p className="text-sm">
                        {new Date(booking.startDate).toLocaleDateString()} - 
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
