import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCompanySchema } from "./CreateCompanySchema";
import { UploadOnCloudinary } from "@/services/cloudinary";

export async function POST(req: NextRequest) {
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

        const admin = session.user;

        if (admin.role !== "ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Not a random request",
                },
                {
                    status: 401,
                }
            );
        }
        // */

        const formData = await req.formData();

        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            location: formData.getAll("location") as [string],
            website: formData.get("website") as string,
            logo: formData.get("logo") as File,
        };

        const validationResult = createCompanySchema.safeParse(data);

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

        const bytes = await data.logo.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const upload = await UploadOnCloudinary(buffer, data.name);

        await prisma.company.create({
            data: {
                name: data.name,
                description: data.description,
                location: data.location,
                // adminId: "20513da0-e8a0-4575-a2f7-631a57d663ea",
                adminId: admin.id,
                website: data.website,
                logoUrl: upload,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Company created successfully!!",
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/create-company : ", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server Error while creating the users company",
            },
            {
                status: 500,
            }
        );
    }
}
