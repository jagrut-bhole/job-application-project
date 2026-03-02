import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { changeJobStatusRequest, jobIdParam } from "./changeJobStatus";

const STATUS_DESCRIPTIONS: Record<string, string> = {
    OPEN: "Job is now open — candidates can apply.",
    CLOSED: "Job has been closed — no more applications will be accepted.",
    PAUSED: "Job has been paused — temporarily not accepting applications.",
};

export async function PATCH(req: NextRequest, { params }: { params: { jobId: string } }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
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

        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const adminId = session.user.id;

        const validatedParams = jobIdParam.safeParse(params);

        if (!validatedParams.success) {
            return NextResponse.json(
                { success: false, message: "Invalid job ID" },
                { status: 400 }
            );
        }

        const { jobId } = validatedParams.data;

        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
        }

        if (job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const data = await req.json();

        const validationData = changeJobStatusRequest.safeParse(data);

        if (!validationData.success) {
            return NextResponse.json(
                { success: false, message: "Invalid request" },
                { status: 400 }
            );
        }

        const { status } = validationData.data;

        if (status === job.status) {
            return NextResponse.json(
                { success: false, message: "Status is already the same" },
                { status: 400 }
            );
        }

        const updatedJob = await prisma.$transaction(async (tx) => {
            const updated = await tx.job.update({
                where: { id: jobId },
                data: { status },
            });

            const noteText =
                `Status changed from ${job.status} → ${status}. ${STATUS_DESCRIPTIONS[status] ?? ""}`.trim();

            await tx.jobNote.create({
                data: {
                    jobId,
                    addedById: adminId,
                    text: noteText,
                    type: "SYSTEM",
                },
            });

            return updated;
        });

        return NextResponse.json(
            {
                success: true,
                message: "Job status updated successfully",
                data: updatedJob,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/job/[jobId]/status [PATCH]: ", error);

        return NextResponse.json(
            { success: false, message: "Server Error while updating the job status" },
            { status: 500 }
        );
    }
}
