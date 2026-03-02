import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ChangeCompanyDetailsSchema } from "./ChangeCompanyDetails";
import { UploadOnCloudinary } from "@/services/cloudinary";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized request",
                },
                {
                    status: 402,
                }
            );
        }

        const adminId = session.user.id;

        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You are not authorized to access this resource.",
                },
                {
                    status: 403,
                }
            );
        }

        const [company, unreadMessagesCount] = await Promise.all([
            prisma.company.findUnique({
                where: {
                    adminId,
                },
                omit: {
                    adminId: true,
                    updatedAt: true,
                },
                include: {
                    jobs: {
                        where: {
                            postedById: adminId,
                        },
                    },
                },
            }),
            prisma.message.count({
                where: {
                    receiverId: adminId,
                    isRead: false,
                },
            }),
        ]);

        return NextResponse.json(
            {
                success: true,
                message: "Company fetched successfully",
                data: {
                    ...company,
                    unreadMessagesCount,
                },
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/company :", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error while fetching the company",
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
                    message: "Unauthorized request",
                },
                {
                    status: 402,
                }
            );
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You are not authorized to access this resource.",
                },
                {
                    status: 403,
                }
            );
        }

        const adminId = session.user.id;

        const companyDetails = await prisma.company.findUnique({
            where: {
                adminId,
            },
        });

        if (!companyDetails) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Company not found",
                },
                {
                    status: 404,
                }
            );
        }

        const formData = await req.formData();

        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            location: formData.getAll("location") as [string],
            website: formData.get("website") as string,
            logo: formData.get("logo") as File,
        };

        const validationResult = ChangeCompanyDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid data received",
                },
                {
                    status: 400,
                }
            );
        }

        let upload;

        if (data.logo && data.logo instanceof File && data.logo.size > 0) {
            const bytes = await data.logo.arrayBuffer();
            const buffer = Buffer.from(bytes);
            upload = await UploadOnCloudinary(buffer, data.name);
        }

        const updatedCompany = await prisma.company.update({
            where: {
                id: companyDetails.id,
            },
            data: {
                name: data.name,
                description: data.description,
                location: data.location,
                website: data.website,
                ...(upload ? { logoUrl: upload } : {}),
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Company updated successfully",
                data: updatedCompany,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/company [PATCH]:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error while updating the company",
            },
            {
                status: 500,
            }
        );
    }
}
