import { deleteAccountPassword } from "./deleteAccountSchema";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Uauthorized Request",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const validationResult = deleteAccountPassword.safeParse(body);

    if (!validationResult.success) {
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

    const { password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        password: true,
        email: true,
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not Found",
        },
        {
          status: 404,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

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

    await prisma.user.delete({
      where: {
        id: user.id,
      },
      select: {
        applications: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account Deleted Successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("Error at /api/auth/delete-account : ", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while deleting users account",
      },
      {
        status: 500,
      }
    );
  }
}
