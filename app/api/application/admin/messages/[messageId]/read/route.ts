import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { messageIdParam } from "../../messageSchema";

// ─── PATCH /api/application/admin/messages/[messageId]/read ──────────────────
// Admin marks a message as read
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
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
        const { messageId } = await params;

        const validation = messageIdParam.safeParse({ messageId });

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid message ID" },
                { status: 400 }
            );
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return NextResponse.json(
                { success: false, message: "Message not found" },
                { status: 404 }
            );
        }

        // Only the receiver can mark as read
        if (message.receiverId !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        if (message.isRead) {
            return NextResponse.json(
                { success: true, message: "Message is already read" },
                { status: 200 }
            );
        }

        await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true },
        });

        return NextResponse.json(
            { success: true, message: "Message marked as read" },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/messages/[messageId]/read [PATCH]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while marking message as read" },
            { status: 500 }
        );
    }
}
