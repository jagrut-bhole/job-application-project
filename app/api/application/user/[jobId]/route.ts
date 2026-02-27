import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const userId = session.user.id;

        const jobId = params.jobId;

        if (!jobId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid jobId",
                },
                {
                    status: 401,
                }
            );
        }

        const jobDetails = await prisma.job.findFirst({
            where: {
                id: jobId,
            },
            omit: {
                postedById: true,
                updatedAt: true,
            },
            include: {
                company: {
                    omit: {
                        updatedAt: true,
                        adminId: true,
                    },
                    include: {
                        jobs: {
                            where: {
                                status: "OPEN",
                                NOT: {
                                    applications: {
                                        some: {
                                            userId: userId,
                                            status: {
                                                in: ["REJECTED", "WITHDRAWN"],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Job details fetched successfully",
                data: jobDetails,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/[jobId] [GET]:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server error while fetching user's job details",
            },
            {
                status: 500,
            }
        );
    }
}
