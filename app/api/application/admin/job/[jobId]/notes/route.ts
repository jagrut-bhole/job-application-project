import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { singleJobDetailsReauest } from "../SingleJobDetail";
import { addNoteRequest } from "./noteSchema";

// ─── GET /api/application/admin/job/[jobId]/notes ────────────────────────────
// Returns all notes (system + user-added) for a job, newest first.
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const validation = singleJobDetailsReauest.safeParse(params);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: "Invalid jobId" }, { status: 400 });
        }

        const { jobId } = validation.data;

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { postedById: true },
        });

        if (!job) {
            return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
        }

        if (job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const notes = await prisma.jobNote.findMany({
            where: { jobId },
            include: {
                addedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
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
        console.log("Error at /api/application/admin/job/[jobId]/notes [GET]: ", error);
        return NextResponse.json(
            { success: false, message: "Server Error while fetching notes" },
            { status: 500 }
        );
    }
}

// ─── POST /api/application/admin/job/[jobId]/notes ───────────────────────────
// Admin manually adds a note to the job activity log.
export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
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

        const validation = singleJobDetailsReauest.safeParse(params);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: "Invalid jobId" }, { status: 400 });
        }

        const { jobId } = validation.data;

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { postedById: true },
        });

        if (!job) {
            return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
        }

        if (job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const result = addNoteRequest.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result.error.issues[0]?.message ?? "Invalid request",
                },
                { status: 400 }
            );
        }

        const note = await prisma.jobNote.create({
            data: {
                jobId,
                addedById: adminId,
                text: result.data.text,
                type: "USER",
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
        console.log("Error at /api/application/admin/job/[jobId]/notes [POST]: ", error);
        return NextResponse.json(
            { success: false, message: "Server Error while adding note" },
            { status: 500 }
        );
    }
}
