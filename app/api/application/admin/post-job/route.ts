import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { postJobRequest } from "./postJobSchema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorize",
                },
                {
                    status: 401,
                }
            );
        }

        const admin = session.user.role;

        if (admin !== "ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Not authorize to make this request",
                },
                {
                    status: 402,
                }
            );
        }

        const data = await req.json();

        const validationResult = postJobRequest.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid Data",
                },
                {
                    status: 401,
                }
            );
        }

        const { title, location, description, salary, skills, type, expiresAt } =
            validationResult.data;

        if (title.length <= 0 || description.length <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Title or description is required",
                },
                {
                    status: 400,
                }
            );
        }

        const company = await prisma.company.findUnique({
            where: {
                adminId: session.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!company) {
            return NextResponse.json(
                { success: false, message: "No company found for this admin" },
                { status: 404 }
            );
        }

        const job = await prisma.job.create({
            data: {
                title,
                description,
                salary,
                location,
                skills,
                type,
                status: "OPEN",
                companyId: company?.id,
                postedById: session.user.id,
                postedAt: new Date(),
                expiresAt,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Job created Successfully!!",
                data: {
                    id: job.id,
                    title: job.title,
                    description: job.description,
                    salary: job.salary,
                    location: job.location,
                    skills: job.skills,
                    type: job.type,
                    status: job.status,
                    expiresAt: job.expiresAt,
                    postedAt: job.postedAt,
                },
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/post-job :", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server error while posting the job",
            },
            {
                status: 500,
            }
        );
    }
}
