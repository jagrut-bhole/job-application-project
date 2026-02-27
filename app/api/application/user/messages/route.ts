import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized Request",
                },
                {
                    status: 402,
                }
            );
        }

        const messages = await prisma.message.findMany({
            where: {
                receiverId: session.user.id,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
                application: {
                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                                company: {
                                    select: {
                                        id: true,
                                        name: true,
                                        logoUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                sentAt: "desc",
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: messages,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/messages : ", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching the user messages",
            },
            {
                status: 500,
            }
        );
    }
}
