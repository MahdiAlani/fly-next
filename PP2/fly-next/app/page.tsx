import { SearchSection } from "@/components/search-section";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { BookingsProvider } from "@/app/bookingsContext";
import { ItinerarySection } from "@/components/itinerary-section";

export default function Home() {
  return (
    <BookingsProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <SearchSection />
          <ItinerarySection />
        </main>
        <Footer />
      </div>
    </BookingsProvider>
  );
}