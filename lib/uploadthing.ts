import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/services/uploadthing";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
