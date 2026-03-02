import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { noteIdParam } from "../noteSchema";

// ─── DELETE /api/application/admin/notes/[noteId] ────────────────────────────
// Delete a specific note
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ noteId: string }> }
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
        const { noteId } = await params;

        const validation = noteIdParam.safeParse({ noteId });

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Invalid note ID" },
                { status: 400 }
            );
        }

        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                application: {
                    select: {
                        job: { select: { postedById: true } },
                    },
                },
            },
        });

        if (!note) {
            return NextResponse.json(
                { success: false, message: "Note not found" },
                { status: 404 }
            );
        }

        // Only the admin who posted the job can delete notes on its applications
        if (note.application.job.postedById !== adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized request" },
                { status: 403 }
            );
        }

        await prisma.note.delete({
            where: { id: noteId },
        });

        return NextResponse.json(
            { success: true, message: "Note deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error at /api/application/admin/notes/[noteId] [DELETE]:", error);
        return NextResponse.json(
            { success: false, message: "Server Error while deleting note" },
            { status: 500 }
        );
    }
}
