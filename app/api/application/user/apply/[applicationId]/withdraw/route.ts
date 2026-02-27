import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { applicationId: string } }) {
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

        const applicationId = params.applicationId;

        const applicationDetails = await prisma.application.findUnique({
            where: {
                id: applicationId,
            },
        });

        if (!applicationDetails) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Application not found",
                },
                {
                    status: 404,
                }
            );
        }

        if (applicationDetails.status !== "PENDING") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Only pending applications can be withdrawn",
                },
                {
                    status: 401,
                }
            );
        }

        await prisma.$transaction(async (tx) => {

            await tx.user.delete({
                where: {
                    id: userId
                },
                select: {
                    applications: {
                        where: {
                            id: applicationId,
                        }
                    }
                }
            })

            await tx.application.update({
                where: {
                    id: applicationId,
                },
                data: {
                    status: "WITHDRAWN",
                },
            });
        });

        return NextResponse.json(
            {
                success: true,
                message: "Application withdrawn successfully",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/user/apply/[applicationId] [PATCH]:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error while withdrawing application",
            },
            {
                status: 500,
            }
        );
    }
}
