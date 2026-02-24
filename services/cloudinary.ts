import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function UploadOnCloudinary(base64Data: Buffer, companyName: string): Promise<string> {
  const dataUri = `data:image/png;base64,${base64Data.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "Job_Application",
    resource_type: "image",
    public_id: `${companyName}_logo`,
  });

  return result.secure_url;
}
