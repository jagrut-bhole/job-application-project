import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import { userMessageSchema } from "./userMessage";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You are not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }

        const userId: string = session.user.id;

        const data = await req.json();

        const validationData = userMessageSchema.safeParse(data);

        if (!validationData.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid message data.",
                },
                {
                    status: 400,
                }
            );
        }

        const { text } = validationData.data;

        const application = await prisma.application.findUnique({
            where: {
                id: applicationId,
            },
            select: {
                id: true,
                userId: true,
                jobId: true,
                job: {
                    select: {
                        postedById: true,
                        postedBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }

        if (application.userId !== userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You are not authorized to send messages for this application.",
                },
                {
                    status: 403,
                }
            );
        }

        const message = await prisma.message.create({
            data: {
                text,
                applicationId,
                senderId: userId,
                receiverId: application.job.postedById,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Message sent successfully.",
                data: message,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/messages/[applicationId] :", error);

        return NextResponse.json(
            {
                success: false,
                message: "An error occurred while sending the message.",
            },
            {
                status: 500,
            }
        );
    }
}
