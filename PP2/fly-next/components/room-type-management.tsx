import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { X } from "lucide-react"
import Image from "next/image"

interface Hotel {
  id: string;
  name: string;
}

interface RoomType {
  id: string;
  name: string;
  amenities: string[];
  pricePerNight: number;
  images: string[];
  rooms: number;
}

export function RoomTypeManagement({ open, onOpenChange }: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [userHotels, setUserHotels] = useState<Hotel[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    amenities: [] as string[],
    pricePerNight: 0,
    images: [] as string[],
    rooms: 1
  })
  const [updateMessage, setUpdateMessage] = useState<{ text: string; isError: boolean }>({ text: '', isError: false })
  const [isAddingRooms, setIsAddingRooms] = useState(true)
  const [roomCount, setRoomCount] = useState(1)
  const [newAmenity, setNewAmenity] = useState("");
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's hotels
  useEffect(() => {
    const fetchUserHotels = async () => {
      if (!open) return;
      
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("Access token is missing")
        }

        const response = await axios.get<{ hotels: Hotel[] }>('/api/hotels/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        })
        setUserHotels(response.data.hotels)
      } catch (error) {
        console.error('Error fetching hotels:', error)
      }
    }

    fetchUserHotels()
  }, [open])

  // Fetch room types when hotel is selected
  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!selectedHotel) return;
      
      setIsLoadingRoomTypes(true)
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("Access token is missing")
        }

        const response = await axios.get<{ roomTypes: RoomType[] }>(`/api/hotels/${selectedHotel}/room-types`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        })
        setRoomTypes((response.data as { roomTypes: RoomType[] }).roomTypes)
      } catch (error) {
        console.error('Error fetching room types:', error)
      } finally {
        setIsLoadingRoomTypes(false)
      }
    }

    fetchRoomTypes()
  }, [selectedHotel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHotel) {
      alert("Please select a hotel first")
      return
    }

    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("Access token is missing")
      }

      await axios.post(`/api/hotels/${selectedHotel}/room-types`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })

      // Refresh room types list
      const response = await axios.get(`/api/hotels/${selectedHotel}/room-types`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })
      setRoomTypes((response.data as { roomTypes: RoomType[] }).roomTypes)
      
      // Reset form
      setFormData({
        name: "",
        amenities: [] as string[],
        pricePerNight: 0,
        images: [] as string[],
        rooms: 1
      })
    } catch (error) {
      console.error('Error creating room type:', error)
      alert('Failed to create room type. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInventoryChange = async (roomTypeId: string) => {
    if (!selectedHotel) return;
    
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) throw new Error("Access token is missing")

      if (isAddingRooms) {
        // Add rooms
        const response = await axios.post<{ newInventory: number }>(
          `/api/hotels/${selectedHotel}/room-types/${roomTypeId}/inventory`,
          { roomsToAdd: roomCount },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        setUpdateMessage({
          text: `Rooms added. Current inventory: ${response.data.newInventory}`,
          isError: false
        })
      } else {
        // Remove rooms
        const response = await axios.patch<{ newInventory: number }>(
          `/api/hotels/${selectedHotel}/room-types/${roomTypeId}/inventory`,
          { removeCount: roomCount },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        setUpdateMessage({
          text: `Rooms removed. Current inventory: ${response.data.newInventory}`,
          isError: false
        })
      }
      
      // Refresh room types
      const refreshResponse = await axios.get(`/api/hotels/${selectedHotel}/room-types`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      setRoomTypes((refreshResponse.data as { roomTypes: RoomType[] }).roomTypes)
    } catch (error: any) {
      setUpdateMessage({
        text: error.response?.data?.error || 'Failed to update inventory',
        isError: true
      })
    }
  }

  const handleAddAmenity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAmenity.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token");

      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append("image", file);
        return axios.post<{ path: string }>("/api/upload", formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      });

      const responses = await Promise.all(uploadPromises);
      const paths = responses.map(response => response.data.path);

      setFormData(prev => ({ ...prev, images: [...prev.images, ...paths] }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Room Type Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Hotel</Label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hotel" />
              </SelectTrigger>
              <SelectContent>
                {userHotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHotel && (
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create Room Type</TabsTrigger>
                <TabsTrigger value="view">View Room Types</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Type Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Double Room, Suite"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerNight">Price per Night</Label>
                    <Input
                      id="pricePerNight"
                      type="number"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value) })}
                      placeholder="Enter price per night"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rooms">Number of Rooms</Label>
                    <Input
                      id="rooms"
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) })}
                      placeholder="Enter number of rooms"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amenities">Amenities</Label>
                    <div className="space-y-2">
                      <Input
                        id="amenities"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyDown={handleAddAmenity}
                        placeholder="Type amenity and press Enter"
                      />
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            <span>{amenity}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAmenity(index)}
                              className="hover:text-sky-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Room Images</Label>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative w-24 h-24 rounded overflow-hidden group">
                            <Image 
                              src={image} 
                              alt={`Room Image ${index + 1}`} 
                              fill 
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 hidden group-hover:flex"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={imagesInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImagesUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imagesInputRef.current?.click()}
                        >
                          Add Images
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Room Type"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="view">
                {isLoadingRoomTypes ? (
                  <div className="text-center py-4">Loading room types...</div>
                ) : roomTypes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No room types found. Create your first room type!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateMessage.text && (
                      <div className={`p-2 rounded ${
                        updateMessage.isError ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      } mb-4`}>
                        {updateMessage.text}
                      </div>
                    )}
                    {roomTypes.map((roomType) => (
                      <div key={roomType.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{roomType.name}</h3>
                            <p className="text-sm text-gray-500">
                              Price per night: ${roomType.pricePerNight}
                            </p>
                            <p className="text-sm text-gray-500">
                              Available rooms: {roomType.rooms}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Amenities:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(Array.isArray(roomType.amenities) ? roomType.amenities : JSON.parse(roomType.amenities as string)).map((amenity: string, index: number) => (
                                  <span
                                    key={index}
                                    className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-sm"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Select value={isAddingRooms ? "add" : "remove"} onValueChange={(value) => setIsAddingRooms(value === "add")}>
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="add">Add Rooms</SelectItem>
                                  <SelectItem value="remove">Remove Rooms</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min="1"
                                value={roomCount}
                                onChange={(e) => setRoomCount(parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleInventoryChange(roomType.id)}
                                disabled={!isAddingRooms && roomType.rooms < roomCount}
                              >
                                {isAddingRooms ? 'Add' : 'Remove'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        {roomType.images && (Array.isArray(roomType.images) ? roomType.images : JSON.parse(roomType.images as string)).length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Room Images</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {(Array.isArray(roomType.images) ? roomType.images : JSON.parse(roomType.images as string)).map((image: string, index: number) => (
                                <div key={index} className="relative flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                                  <Image 
                                    src={image}
                                    alt={`${roomType.name} Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}