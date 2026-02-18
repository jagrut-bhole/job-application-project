import prisma from "@/lib/prisma";
import { changePasswordRequest } from "./changePasswordSchema";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized request",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const validationResult = changePasswordRequest.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Data",
        },
        {
          status: 401,
        }
      );
    }

    const { oldPassword, newPassword } = validationResult.data;

    if (oldPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Password Same",
        },
        {
          status: 400,
        }
      );
    }

    const userCheck = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
      },
    });

    if (!userCheck) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, userCheck.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Password",
        },
        {
          status: 401,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: userCheck.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password change successfully",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log("Error at /api/auth/change-password : ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error while changing the users password",
      },
      {
        status: 500,
      }
    );
  }
}
