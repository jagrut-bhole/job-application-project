import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
                    status: 404,
                }
            );
        }

        if (session.user.role !== "ADMIN") {
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

        const adminId = session.user.id;

        const jobs = await prisma.job.findMany({
            where: {
                postedById: adminId,
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                postedAt: true,
                expiresAt: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        const applicationsCount = await prisma.application.count({
            where: {
                jobId: {
                    in: jobs.map((job) => job.id),
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Jobs fetched successfully",
                data: {
                    ...jobs,
                    applicationsCount,
                },
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/jobs [GET]: ", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching the jobs",
            },
            {
                status: 500,
            }
        );
    }
}
