import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized request",
                },
                {
                    status: 402,
                }
            );
        }

        const pageSize = 20; // Number of items per page
        const currentPage = 1; // Current page number (1-based index)
        const skipAmount = (currentPage - 1) * pageSize;

        const jobs = await prisma.job.findMany({
            where: {
                status: "OPEN",
                NOT: {
                    applications: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
            },
            take: pageSize,
            skip: skipAmount,
            orderBy: {
                id: "desc",
            },
            omit: {
                postedById: true,
                expiresAt: true,
            },
            include: {
                company: {
                    omit: {
                        adminId: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Jobs fetched successfully",
                data: jobs,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/all-jobs :", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching all the jobs",
            },
            {
                status: 500,
            }
        );
    }
}
