import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// ─── GET /api/application/admin/messages ─────────────────────────────────────
// All messages received by admin (from users), newest first
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
        const page = Math.max(1, Number(searchParams.get("page") ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        const where = {
            receiverId: adminId,
            ...(unreadOnly ? { isRead: false } : {}),
        };

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        },
                    },
                    application: {
                        select: {
                            id: true,
                            status: true,
                            job: {
                                select: { id: true, title: true },
                            },
                        },
                    },
                },
                orderBy: { sentAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.message.count({ where }),
        ]);

        return NextResponse.json(
            {
                success: true,
                message: "Messages fetched successfully",
                data: {
                    messages,
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
        console.log("Error at /api/application/admin/messages [GET]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while fetching messages" },
            { status: 500 }
        );
    }
}
