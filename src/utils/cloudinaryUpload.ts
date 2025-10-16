import {

  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";
import cloudinary from "./cloudinary";
import { Readable } from "stream";

export function uploadBufferToCloudinary(
  buffer: Buffer,
  publicIdBase?: string,
  folder?: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      resource_type: "auto",
      access_mode: "public",
    };

    if (folder) {
      options.folder = folder; // ✅ only assign if defined
    }

    if (publicIdBase) {
      options.public_id = publicIdBase;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}
