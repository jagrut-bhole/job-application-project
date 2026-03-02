import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const { messageId } = await params;
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

        const message = await prisma.message.findUnique({
            where: {
                id: messageId,
            },
        });

        if (!message) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid message ID.",
                },
                {
                    status: 400,
                }
            );
        }

        if (message.receiverId !== session.user.id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You are not authorized to mark this message as read.",
                },
                {
                    status: 403,
                }
            );
        }

        await prisma.message.update({
            where: {
                id: message.id,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Message marked as read.",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/messages/[messageId]/read :", error);

        return NextResponse.json(
            {
                success: false,
                message: "An error occurred while marking the message as read.",
            },
            {
                status: 500,
            }
        );
    }
}
