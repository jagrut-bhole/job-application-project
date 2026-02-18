import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AppliedSchemaResponse } from './appliedSchema'

export async function POST(): Promise<NextResponse<AppliedSchemaResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized Request",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.application.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        company: true,
        position: true,
        jobDescription: true,
        appliedDate: true,
        status: true,
        salary: true,
        location: true,
        notes: {
          select: {
            text: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Applied Applications fetched successfully",
        data: user,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("Error at /api/auth/applied : ", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching applications",
      },
      {
        status: 500,
      }
    );
  }
}
