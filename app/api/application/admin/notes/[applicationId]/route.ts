import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { addAppNoteSchema, applicationIdParam } from "../noteSchema";

// ─── GET /api/application/admin/notes/[applicationId] ────────────────────────
// Get all notes for an application
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
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
        const { applicationId } = await params;

        const validation = applicationIdParam.safeParse({ applicationId });

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid application ID" },
                { status: 400 }
            );
        }

        // Verify admin owns the job this application belongs to
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: {
                job: { select: { postedById: true } },
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, message: "Application not found" },
                { status: 404 }
            );
        }

        if (application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const notes = await prisma.note.findMany({
            where: { applicationId },
            include: {
                addedBy: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { addedAt: "desc" },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Notes fetched successfully",
                data: notes,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/notes/[applicationId] [GET]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while fetching notes" },
            { status: 500 }
        );
    }
}

// ─── POST /api/application/admin/notes/[applicationId] ───────────────────────
// Add internal note to an application
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
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
        const { applicationId } = await params;

        const paramValidation = applicationIdParam.safeParse({ applicationId });

        if (!paramValidation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid application ID" },
                { status: 400 }
            );
        }

        // Verify admin owns the job
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: {
                job: { select: { postedById: true } },
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, message: "Application not found" },
                { status: 404 }
            );
        }

        if (application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validation = addAppNoteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Invalid request",
                },
                { status: 400 }
            );
        }

        const note = await prisma.note.create({
            data: {
                applicationId,
                addedById: adminId,
                text: validation.data.text,
            },
            include: {
                addedBy: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Note added successfully",
                data: note,
            },
            { status: 201 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/notes/[applicationId] [POST]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while adding note" },
            { status: 500 }
        );
    }
}
