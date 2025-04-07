"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import Image from "next/image";
import { useAuth } from "@/app/context/authContext";

interface ProfileComponentProps {
  onClose: () => void;
}

export default function ProfileComponent({ onClose }: ProfileComponentProps) {
  const { refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePic, setProfilePic] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          throw new Error("Access token is missing. Please log in again.");
        }

        const response = await axios.get<{
          user: { firstName: string; lastName: string; email: string; phoneNumber: string; profilePic: string };
        }>("/api/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const user = response.data.user;
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
        setProfilePic(user.profilePic || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to fetch user data. Please try again.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [onClose]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token");

      // First upload the image
      const uploadResponse = await axios.post<{ path: string }>("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Get current user data
      const userResponse = await axios.get<{
        user: { firstName: string; lastName: string; email: string; phoneNumber: string; profilePic: string };
      }>("/api/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const currentUser = userResponse.data.user;

      // Update user with current data plus new profile pic
      await axios.put(
        "/api/user",
        {
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phoneNumber: currentUser.phoneNumber,
          profilePic: uploadResponse.data.path,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Update local state after successful save
      setProfilePic(uploadResponse.data.path);

      // After successful update, refresh the user data in auth context
      await refreshUser();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        firstName,
        lastName,
        email,
        phoneNumber,
        profilePic,
      };

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        throw new Error("Access token is missing. Please log in again.");
      }

      await axios.put("/api/user", updatedUser, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // After successful save, refresh the user data in auth context
      await refreshUser();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-96">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

      <div className="mb-6 flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
          {(imagePreview || profilePic) ? (
            <Image 
              src={imagePreview || profilePic} 
              alt="Profile" 
              fill 
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Change Photo
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
          />
        </div>
      </div>
      <div className="flex justify-end mt-6 gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button className="bg-sky-500 hover:bg-sky-600" type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}