import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { adminMessageSchema, applicationIdParam } from "../messageSchema";

// ─── POST /api/application/admin/messages/[applicationId] ────────────────────
// Admin sends a message to the user who applied (tied to a specific application)
export async function POST(
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

        const paramValidation = applicationIdParam.safeParse({ applicationId });

        if (!paramValidation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid application ID" },
                { status: 400 }
            );
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: {
                id: true,
                userId: true,
                job: {
                    select: { postedById: true },
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, message: "Application not found" },
                { status: 404 }
            );
        }

        // Only the admin who posted the job can message on this application
        if (application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validation = adminMessageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Invalid request",
                },
                { status: 400 }
            );
        }

        const message = await prisma.message.create({
            data: {
                applicationId,
                senderId: adminId,
                receiverId: application.userId,
                text: validation.data.text,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Message sent successfully",
                data: message,
            },
            { status: 201 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/messages/[applicationId] [POST]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while sending message" },
            { status: 500 }
        );
    }
}
