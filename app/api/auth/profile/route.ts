import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ProfileSchemaResponse } from './profileSchema'

export async function POST() : Promise<NextResponse<ProfileSchemaResponse>> {
    try {

        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                {
                    success : false,
                    message : "Unauthorized Request"
                },
                {
                    status: 401
                }
            )
        }

        const userProfile = await prisma.user.findUnique({
            where: {
                id: session.user.id
            },
            select: {
                id: true,
                role: true,
                name: true,
                email: true,
                createdAt: true,
                _count: {
                    select : {
                        applications: {
                            where: {
                                userId : session.user.id
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(
            {
                success : true,
                message : "Profile fetch Succesfully",
                data: userProfile
            },
            {
                status: 200
            }
        )
        
    } catch (error) {
        console.log('Error at /api/auth/profile : ', error);

        return NextResponse.json(
            {
                success : false,
                message : "Server error while fetching the users profile"
            },
            {
                status: 500
            }
        )
    }
}