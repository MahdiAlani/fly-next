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
import Image from "next/image"

interface Hotel {
  id: string;
  name: string;
  address: string;
  location: string;
  rating: number;
  logo?: string;
  images?: string[];
}

export function HotelCreation({ open, onOpenChange }: { 
    open: boolean
    onOpenChange: (open: boolean) => void 
  }) {
    const [activeTab, setActiveTab] = useState("create");
    const [formData, setFormData] = useState({
      name: "",
      address: "",
      location: "",
      rating: 1,
      logo: null as string | null,
      images: [] as string[]
    })
    const [isLoading, setIsLoading] = useState(false)
    const [userHotels, setUserHotels] = useState<Hotel[]>([])
    const [isLoadingHotels, setIsLoadingHotels] = useState(false)

    const logoInputRef = useRef<HTMLInputElement>(null);
    const imagesInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const fetchUserHotels = async () => {
        if (!open) return;
        
        setIsLoadingHotels(true)
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
        } finally {
          setIsLoadingHotels(false)
        }
      }

      fetchUserHotels()
    }, [open])

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const formData = new FormData();
      formData.append("image", file);
    
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error("No access token");
    
        const response = await axios.post<{ path: string }>("/api/upload", formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
    
        setFormData(prev => ({ ...prev, logo: response.data.path }));
      } catch (error) {
        console.error("Error uploading logo:", error);
        alert("Failed to upload logo. Please try again.");
      }
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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("Access token is missing. Please log in again.")
        }
    
        const response = await axios.post('/api/hotels/', formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        })
        
        const hotelsResponse = await axios.get<{ hotels: Hotel[] }>('/api/hotels/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        });
        setUserHotels(hotelsResponse.data.hotels);

        setFormData({
          name: "",
          address: "",
          location: "",
          rating: 1,
          logo: "",
          images: []
        });

        setActiveTab("view");
        
      } catch (error) {
        console.error('Error creating hotel:', error)
        alert('Failed to create hotel. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Hotel Management</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Hotel</TabsTrigger>
            <TabsTrigger value="view">My Hotels</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter hotel name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter hotel address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter hotel location"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Star Rating</Label>
                <Select 
                  value={formData.rating.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select star rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Hotel Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo && (
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image 
                        src={formData.logo} 
                        alt="Hotel Logo" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {formData.logo ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Hotel Images</Label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative w-24 h-24 rounded overflow-hidden group">
                        <Image 
                          src={image} 
                          alt={`Hotel Image ${index + 1}`} 
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
                  {isLoading ? "Creating..." : "Create Hotel"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="view" className="max-h-[70vh] overflow-y-auto">
            {isLoadingHotels ? (
              <div className="text-center py-4">Loading hotels...</div>
            ) : userHotels.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No hotels found. Create your first hotel!
              </div>
            ) : (
              <div className="space-y-4">
                {userHotels.map((hotel) => (
                  <div 
                    key={hotel.id} 
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex gap-4">
                      {/* Logo Section */}
                      <div className="flex-shrink-0">
                        {hotel.logo ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                            <Image 
                              src={hotel.logo} 
                              alt={`${hotel.name} Logo`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No Logo</span>
                          </div>
                        )}
                      </div>

                      {/* Hotel Info Section */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{hotel.name}</h3>
                            <p className="text-sm text-gray-500">{hotel.address}</p>
                            <p className="text-sm text-gray-500">{hotel.location}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(hotel.rating)].map((_, i) => (
                              <span key={i} className="text-yellow-400">★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Images Gallery Section */}
                    {hotel.images && hotel.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Hotel Images</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {(Array.isArray(hotel.images) ? hotel.images : JSON.parse(hotel.images as string)).map((image: string, index: number) => (
                            <div key={index} className="relative flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                              <Image 
                                src={image}
                                alt={`${hotel.name} Image ${index + 1}`}
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
      </DialogContent>
    </Dialog>
  )
}