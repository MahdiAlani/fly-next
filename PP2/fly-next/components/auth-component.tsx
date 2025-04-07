"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane } from "lucide-react";
import { LoginCredentials, RegisterData } from "@/app/types/auth";
import { useAuth } from "@/app/context/authContext";

export default function AuthComponent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("signin");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const router = useRouter();
  const { login, register } = useAuth();

  // Sign in handler that uses authService.login
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    const credentials: LoginCredentials = { email, password };

    try {
      await login(credentials);
      setNotification({
        type: "success",
        text: "Successfully signed in! Welcome back.",
      });
      setIsLoading(false);
      onClose();
      router.push("/"); // Redirect after successful sign in.
    } catch (error: any) {
      console.error("Sign in error:", error);
      setNotification({
        type: "error",
        text: error.message || "Sign in failed. Please check your credentials and try again.",
      });
      setIsLoading(false);
    }
  };

  // Sign up handler that uses authService.register
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("first-name") as HTMLInputElement)?.value;
    const lastName = (form.elements.namedItem("last-name") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email-signup") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password-signup") as HTMLInputElement)?.value;
    const phoneNumber = (form.elements.namedItem("phoneNumber") as HTMLInputElement)?.value || "";

    const userData: RegisterData = { firstName, lastName, email, password, phoneNumber };

    try {
      await register(userData);
      setNotification({
        type: "success",
        text: "Registration successful. Please sign in to continue.",
      });
      setIsLoading(false);
      // Switch to the sign in tab
      setActiveTab("signin");
    } catch (error: any) {
      console.error("Sign up error:", error);
      setNotification({
        type: "error",
        text: error.message || "Sign up failed. Please try again later.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-muted rounded-lg shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-sky-500" />
              <span className="text-2xl font-bold ml-2">FlyNext</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome to FlyNext</h1>
            <p className="text-gray-500 mt-2">
              Sign in to access your account or create a new one
            </p>
          </div>

          {/* Notification message */}
          {notification && (
            <div
              className={`mb-4 p-2 rounded ${
                notification.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
              }`}
            >
              {notification.text}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" name="first-name" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" name="last-name" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" name="email-signup" type="email" placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" name="password-signup" type="password" placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+1 234 567 890" />
                </div>
                <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
