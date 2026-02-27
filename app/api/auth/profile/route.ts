import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileSchemaResponse, updateProfileSchema } from "./profileSchema";
import { UploadOnCloudinary } from "@/services/cloudinary";

export async function GET(): Promise<NextResponse<ProfileSchemaResponse>> {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
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

        const userEmail = session.user.email;

        const userDetails = await prisma.user.findUnique({
            where: {
                email: userEmail,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                resumeUrl: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "User profile fetched successfully",
                data: userDetails,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/auth/profile [GET]:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error while fetching users profile",
            },
            {
                status: 500,
            }
        );
    }
}

export async function PATCH(req: NextRequest) {
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

        const userEmail = session.user.email;

        const formData = await req.formData();

        const data = {
            name: formData.get("name") as string,
            bio: formData.get("bio") as string,
            skills: formData.getAll("skills") as [string],
            resume: formData.get("resumeUrl") as File,
            logo: formData.get("profileImage") as File,
        };

        const validationResult = updateProfileSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validationResult.error || "Invlid Data received",
                },
                {
                    status: 401,
                }
            );
        }

        const logoBytes = await data.logo.arrayBuffer();

        const logoBuffer = Buffer.from(logoBytes);

        const uploadLogo = await UploadOnCloudinary(logoBuffer, data.name);

        await prisma.user.update({
            where: {
                email: userEmail,
            },
            data: {
                name: data.name,
                bio: data.bio,
                skills: data.skills,
                resumeUrl: uploadLogo,
                profileImage: uploadLogo,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                resumeUrl: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Profile updated successfully!!",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/auth/profile [PATCH]:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error while updating users profile",
            },
            {
                status: 500,
            }
        );
    }
}
