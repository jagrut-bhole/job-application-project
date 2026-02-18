import prisma from "@/lib/prisma";
import { registerSchema } from "./RegisterSchema";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Data Received",
        },
        {
          status: 400,
        }
      );
    }

    const { email, name, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (user) {
      return NextResponse.json({
        success: false,
        message: "User already exists!!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User Account created succcessfully!!",
      data: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
      },
    });
  } catch (error) {
    console.log("Error at /api/auth/register :", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error at while registering the user",
      },
      {
        status: 500,
      }
    );
  }
}
