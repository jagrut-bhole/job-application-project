import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { singleJobDetailsReauest, editJobRequest } from "./SingleJobDetail";

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const validation = singleJobDetailsReauest.safeParse(params);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid jobId",
                },
                {
                    status: 400,
                }
            );
        }

        const { jobId } = validation.data;

        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
            omit: {
                companyId: true,
            },
            include: {
                applications: {
                    where: {
                        status: "PENDING",
                    },
                    select: {
                        id: true,
                        userId: true,
                        jobId: true,
                        status: true,
                        coverLetter: true,
                        appliedAt: true,
                    },
                    orderBy: {
                        appliedAt: "desc",
                    },
                },
                notes: {
                    include: {
                        addedBy: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: {
                        addedAt: "desc",
                    },
                },
            },
        });

        if (!job) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Job not found",
                },
                {
                    status: 404,
                }
            );
        }

        if (job.postedById !== adminId) {
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

        return NextResponse.json(
            {
                success: true,
                message: "Job details fetched successfully",
                data: job,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/job/[jobId] [GET]: ", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching the job",
            },
            {
                status: 500,
            }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const validation = singleJobDetailsReauest.safeParse(params);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: "Invalid jobId" }, { status: 400 });
        }

        const { jobId } = validation.data;

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

        // Notes are cascade-deleted with the job, so just delete the job
        await prisma.job.delete({
            where: { id: jobId },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Job "${job.title}" deleted successfully`,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/job/[jobId] [DELETE]: ", error);
        return NextResponse.json(
            { success: false, message: "Server Error while deleting the job" },
            { status: 500 }
        );
    }
}
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

        const validation = singleJobDetailsReauest.safeParse(params);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid jobId",
                },
                {
                    status: 400,
                }
            );
        }

        const { jobId } = validation.data;

        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
            omit: {
                companyId: true,
            },
        });

        if (!job) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Job not found",
                },
                {
                    status: 404,
                }
            );
        }

        if (job.postedById !== adminId) {
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

        const data = await req.json();

        const result = editJobRequest.safeParse(data);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request",
                },
                {
                    status: 400,
                }
            );
        }

        const { title, description, salary, location, type, skills, expiresAt } = result.data;

        // Build a human-readable list of what changed
        const changedFields: string[] = [];
        if (title !== undefined && title !== job.title) changedFields.push("title");
        if (description !== undefined && description !== job.description)
            changedFields.push("description");
        if (salary !== undefined && salary !== job.salary) changedFields.push("salary");
        if (location !== undefined && location !== job.location) changedFields.push("location");
        if (type !== undefined && type !== job.type) changedFields.push("type");
        if (skills !== undefined) changedFields.push("skills");
        if (expiresAt !== undefined) changedFields.push("expiresAt");

        const updatedJob = await prisma.$transaction(async (tx) => {
            const updated = await tx.job.update({
                where: { id: jobId },
                data: {
                    title,
                    description,
                    salary,
                    location,
                    type,
                    skills,
                    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                    updatedAt: new Date(),
                },
            });

            const noteText =
                changedFields.length > 0
                    ? `Job details updated. Changed fields: ${changedFields.join(", ")}.`
                    : "Job details updated.";

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

        if (!updatedJob) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to update job",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Job updated successfully",
                data: updatedJob,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/job/[jobId] [PATCH]: ", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while updating the job",
            },
            {
                status: 500,
            }
        );
    }
}
