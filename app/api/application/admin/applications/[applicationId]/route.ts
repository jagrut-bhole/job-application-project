import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { applicationIdParam } from "../applicationSchema";

// ─── GET /api/application/admin/applications/[applicationId] ─────────────────
// Full detail of one application (user info, cover letter, resume, notes, messages)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
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
        const { applicationId } = await params;

        const validation = applicationIdParam.safeParse({ applicationId });

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid application ID" },
                { status: 400 }
            );
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        bio: true,
                        skills: true,
                        resumeUrl: true,
                        profileImage: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        postedById: true,
                        company: {
                            select: { id: true, name: true },
                        },
                    },
                },
                notes: {
                    include: {
                        addedBy: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { addedAt: "desc" },
                },
                messages: {
                    orderBy: { sentAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, message: "Application not found" },
                { status: 404 }
            );
        }

        // Verify that this application belongs to a job the admin posted
        if (application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Application details fetched successfully",
                data: application,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/applications/[applicationId] [GET]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while fetching application details" },
            { status: 500 }
        );
    }
}
