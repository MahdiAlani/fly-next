import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import bcrypt from "bcrypt";
import { isValidInput, isValidEmail, isValidPhoneNumber } from "@/lib/validators/validators";
import { SignupRequestBody } from "@/app/api/types/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse and typecast the JSON body.
    const { firstName, lastName, email, password, phoneNumber } =
      (await request.json()) as SignupRequestBody;
    // Validate first name.
    if (!isValidInput(firstName, "string")) {
      return NextResponse.json({ error: "First name is invalid" }, { status: 400 });
    }

    // Validate last name.
    if (!isValidInput(lastName, "string")) {
      return NextResponse.json({ error: "Last name is invalid" }, { status: 400 });
    }

    // Validate email.
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email is invalid" }, { status: 400 });
    }
    
    // Check for duplicate email.
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    // Validate password.
    if (!isValidInput(password, "string")) {
      return NextResponse.json({ error: "Password is invalid" }, { status: 400 });
    }
    // Validate phone number if provided.cl
    if (phoneNumber) {
      if (!isValidPhoneNumber(phoneNumber)) {
        return NextResponse.json({ error: "Phone number is invalid" }, { status: 400 });
      }
    }
    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new user in the database.
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Optionally log error details here.
    console.log(error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
