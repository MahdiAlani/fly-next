export interface CreateHotelRequestBody {
  name: string;
  logo?: string | null;
  address: string;
  location: string;
  rating?: number;
  images?: string[];
}