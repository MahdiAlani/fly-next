import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building, BedDouble, Calendar, Users } from "lucide-react"
import { useState } from "react"

import { HotelCreation } from "@/components/hotel-creation"
import { RoomTypeManagement } from "@/components/room-type-management"
import { BookingManagement } from "@/components/booking-management"

export function HotelManagement() {
  const [addHotelOpen, setAddHotelOpen] = useState(false)
  const [roomTypeOpen, setRoomTypeOpen] = useState(false)
  const [bookingManagementOpen, setBookingManagementOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-sky-500 hover:bg-sky-600">Hotel Management</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem
            className="flex items-center" 
            onSelect={() => setAddHotelOpen(true)}
          >
            <Building className="mr-2 h-4 w-4" />
            <span>Add New Hotel</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center" 
            onSelect={() => setRoomTypeOpen(true)}
          >
            <BedDouble className="mr-2 h-4 w-4" />
            <span>Manage Room Types</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center" 
            onSelect={() => setBookingManagementOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Booking Management</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center" onSelect={() => {}}>
            <Users className="mr-2 h-4 w-4" />
            <span>Room Availability</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <HotelCreation open={addHotelOpen} onOpenChange={setAddHotelOpen} />
      <RoomTypeManagement open={roomTypeOpen} onOpenChange={setRoomTypeOpen} />
      <BookingManagement open={bookingManagementOpen} onOpenChange={setBookingManagementOpen} />
    </>
  )
}