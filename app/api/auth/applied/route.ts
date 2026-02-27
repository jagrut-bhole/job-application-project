import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppliedSchemaResponse } from "./appliedSchema";

export async function GET(): Promise<NextResponse<AppliedSchemaResponse>> {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
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

        const userEmail = session.user.email;

        const appliedJobs = await prisma.application.findMany({
            where: {
                user: {
                    email: userEmail,
                },
            },
            orderBy: {
                appliedAt: "desc",
            },
            include: {
                job: {
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                                location: true,
                                website: true,
                            },
                        },
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        salary: true,
                        location: true,
                        type: true,
                        postedAt: true,
                        status: true,
                    },
                },
            },
        });

        const formattedJobs = appliedJobs.map(({ job }) => job);

        return NextResponse.json(
            {
                success: true,
                message: "Applied jobs fetched successfully",
                data: formattedJobs,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/auth/applied :", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching user's applied jobs",
            },
            {
                status: 500,
            }
        );
    }
}
