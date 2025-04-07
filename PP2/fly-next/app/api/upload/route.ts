import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { verifyToken } from "@/lib/middleware/middleware";

export async function POST(request: Request) {
  // Verify token
  const authResponse = verifyToken(request);
  if (authResponse.status !== 200) return authResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    // Check if the file is valid
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueName = `${Date.now()}-${file.name}`;
    const path = join(process.cwd(), "public", "uploads", uniqueName);
    await writeFile(path, buffer);

    // Return the public URL
    const publicPath = `/uploads/${uniqueName}`;
    return NextResponse.json({ path: publicPath }, { status: 200 });
  } 
  
  catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}