import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
    resumeUploader: f({
        pdf: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const session = await getServerSession(authOptions);

            if (!session?.user?.id) throw new UploadThingError("Unauthorized");

            return {
                userId: session.user.id,
            };
        })

        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Resume upload complete for userId:", metadata.userId);
            console.log("Resume URL:", file.ufsUrl);

            await prisma.user.update({
                where: { id: metadata.userId },
                data: { resumeUrl: file.ufsUrl },
            });

            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
