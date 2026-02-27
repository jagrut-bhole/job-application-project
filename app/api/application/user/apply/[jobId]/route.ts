import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyJobIdSchema } from "./applyJobIdSchema";

export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const data = await req.json();

        const validationResult = applyJobIdSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validationResult.error || "Invlid Data received",
                },
                {
                    status: 400,
                }
            );
        }

        const { coverLetter } = validationResult.data;

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

        const jobDetails = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
        });

        if (!jobDetails) {
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

        if (jobDetails.status !== "OPEN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Job is not open",
                },
                {
                    status: 401,
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        const userSkills = user?.skills.map((s) => s.toLowerCase()) || [];
        const jobSkills = jobDetails.skills.map((s) => s.toLowerCase()) || [];

        const hasRequiredSkills = jobSkills.filter((skill) => userSkills.includes(skill)).length;

        if (hasRequiredSkills < 2) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have the required skills for this job",
                },
                {
                    status: 401,
                }
            );
        }

        await prisma.$transaction(async (tx) => {
            const application = await tx.application.create({
                data: {
                    userId,
                    jobId,
                    status: "PENDING",
                    ...(coverLetter && { coverLetter }),
                },
            });

            await tx.note.create({
                data: {
                    text: `Applied to job ${jobDetails.title} by ${session.user.name}`,
                    addedById: userId,
                    applicationId: application.id,
                },
            });

            await tx.message.create({
                data: {
                    text: `Application submitted for job ${jobDetails.title}`,
                    receiverId: userId,
                    senderId: jobDetails.postedById,
                    applicationId: application.id,
                },
            });
        });

        return NextResponse.json(
            {
                success: true,
                message: "Application submitted successfully",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/apply/[jobId] [POST]:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while applying to a job",
            },
            {
                status: 500,
            }
        );
    }
}
