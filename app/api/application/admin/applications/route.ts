import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@/app/generated/prisma/enums";

// ─── GET /api/application/admin/applications ─────────────────────────────────
// Get all applications for jobs posted by this admin (filterable by status)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 401 }
            );
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const adminId = session.user.id;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") ?? undefined;
        const page = Math.max(1, Number(searchParams.get("page") ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

        const where = {
            job: { postedById: adminId },
            ...(status ? { status: status as ApplicationStatus } : {}),
        };

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where,
                select: {
                    id: true,
                    status: true,
                    coverLetter: true,
                    appliedAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                            resumeUrl: true,
                        },
                    },
                    job: {
                        select: {
                            id: true,
                            title: true,
                            company: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
                orderBy: { appliedAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.application.count({ where }),
        ]);

        return NextResponse.json(
            {
                success: true,
                message: "Applications fetched successfully",
                data: {
                    applications,
                    pagination: {
                        page,
                        pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize),
                    },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/applications [GET]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while fetching applications" },
            { status: 500 }
        );
    }
}
