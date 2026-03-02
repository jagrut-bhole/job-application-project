import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { applicationIdParam, applicationStatusSchema } from "../../applicationSchema";

const STATUS_LABELS: Record<string, string> = {
    REVIEWED: "Application has been reviewed.",
    SHORTLISTED: "Candidate has been shortlisted.",
    INTERVIEW: "Interview has been scheduled.",
    OFFER: "An offer has been extended.",
    REJECTED: "Application has been rejected.",
    HIRED: "Candidate has been hired!",
};

// ─── PATCH /api/application/admin/applications/[applicationId]/status ────────
// Change application status — auto-generates a system Note
export async function PATCH(
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
            include: {
                job: {
                    select: { postedById: true, title: true },
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, message: "Application not found" },
                { status: 404 }
            );
        }

        if (application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validation = applicationStatusSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid status value" },
                { status: 400 }
            );
        }

        const { status } = validation.data;

        if (status === application.status) {
            return NextResponse.json(
                { success: false, message: "Status is already the same" },
                { status: 400 }
            );
        }

        const oldStatus = application.status;

        const updatedApplication = await prisma.$transaction(async (tx) => {
            const updated = await tx.application.update({
                where: { id: applicationId },
                data: { status },
            });

            // System-generated note on the application
            const noteText =
                `Status changed from ${oldStatus} → ${status}. ${STATUS_LABELS[status] ?? ""}`.trim();

            await tx.note.create({
                data: {
                    applicationId,
                    addedById: adminId,
                    text: noteText,
                },
            });

            return updated;
        });

        return NextResponse.json(
            {
                success: true,
                message: "Application status updated successfully",
                data: updatedApplication,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log(
            "Error at /api/application/admin/applications/[applicationId]/status [PATCH]:",
            error
        );
        return NextResponse.json(
            { success: false, message: "Server Error while updating application status" },
            { status: 500 }
        );
    }
}
