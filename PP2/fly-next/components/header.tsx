"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, BookOpen, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBadge } from "@/components/notifications";
import { useState } from "react";
import CheckoutComponent from "@/components/booking-section";
import AuthComponent from "@/components/auth-component";
import ProfileComponent from "@/components/profile-component";
import { useAuth } from "@/app/context/authContext";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HotelManagement } from "@/components/hotel-management";
import { useBookings } from "@/app/bookingsContext";
import Image from "next/image";

export function Header() {
  const [isAuthPopupOpen, setAuthPopupOpen] = useState(false);
  const [isProfilePopupOpen, setProfilePopupOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { bookings } = useBookings();

  const toggleAuthPopup = () => {
    setAuthPopupOpen(!isAuthPopupOpen);
  };

  const toggleProfilePopup = () => {
    setProfilePopupOpen(!isProfilePopupOpen);
  };

  const handleLogout = () => {
    logout();
    setAuthPopupOpen(true);
  };

  const [isCheckoutPopupOpen, setCheckoutPopupOpen] = useState(false);
  const toggleCheckoutPopup = () => setCheckoutPopupOpen(!isCheckoutPopupOpen);

  const bookingCount = bookings.reduce((count, item) => count + item.quantity, 0);

  return (
    <header className="border-b sticky top-0 z-50 bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-sky-500" />
          <span className="text-xl font-bold">FlyNext</span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && <HotelManagement />}
          <ThemeToggle />
          <DropdownMenu open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full" aria-label="Shopping cart">
                <BookOpen className="h-[1.2rem] w-[1.2rem]" />
                {bookingCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-sky-500 text-white border-0">
                    {bookingCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 w-[400px]">
              <CheckoutComponent onClose={() => setIsCheckoutOpen(false)} />
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <>
              <NotificationBadge />
              <DropdownMenu open={isProfilePopupOpen} onOpenChange={setProfilePopupOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full overflow-hidden" aria-label="User profile">
                    {user?.profilePic ? (
                      <Image 
                        src={user.profilePic}
                        alt="Profile"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-[1.2rem] w-[1.2rem]" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-0">
                  <ProfileComponent onClose={() => setProfilePopupOpen(false)} />
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-sky-500 hover:bg-sky-600"
              onClick={toggleAuthPopup}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
      {isCheckoutPopupOpen && (
        <div className="absolute top-16 right-4 z-50">
          <CheckoutComponent onClose={toggleCheckoutPopup} />
        </div>
      )}
      {isAuthPopupOpen && !isAuthenticated && (
        <div className="absolute top-16 right-4 z-50">
          <AuthComponent onClose={toggleAuthPopup} />
        </div>
      )}
    </header>
  );
}