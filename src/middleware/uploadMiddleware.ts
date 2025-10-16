// Import Multer, a middleware for handling multipart/form-data, primarily used for uploading files in Node.js applications
import multer from "multer";
// Import Request type from Express to type-check the request object in the file filter function
import { Request } from "express";

// Configure Multer to use memory storage, which stores uploaded files in memory as Buffer objects rather than saving them to disk
const storage = multer.memoryStorage();

// Define a file filter function to control which files are accepted for upload
const fileFilter = (
  req: Request, // Express request object containing information about the HTTP request
  file: Express.Multer.File, // File object containing information about the uploaded file
  cb: multer.FileFilterCallback // Callback function to indicate whether the file should be accepted or rejected
) => {
  // Check if the file's MIME type matches any of the allowed types
  if (
    file.mimetype.startsWith("image/") || // Allow all image types (e.g., image/jpeg, image/png)
    file.mimetype.startsWith("video/") || // Allow all video types (e.g., video/mp4, video/avi)
    file.mimetype === "application/pdf" || // Allow PDF files
    file.mimetype === "text/plain" || // Allow plain text files
    file.mimetype === "application/msword" || // Allow Microsoft Word documents (.doc)
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // Allow Microsoft Word documents (.docx)
  ) {
    // If the file type is allowed, call the callback with null (no error) and true (accept the file)
    cb(null, true);
  } else {
    // If the file type is not allowed, call the callback with an Error object containing a descriptive message
    cb(new Error("Only image, video, PDF, text, and document files are allowed"));
  }
};

// Create and export a Multer instance configured with the specified storage, limits, and file filter
export const upload = multer({
  storage, // Use the memory storage configuration defined above
  limits: { fileSize: 50 * 1024 * 1024 }, // Set the maximum file size limit to 50MB (50 * 1024 * 1024 bytes)
  fileFilter, // Use the file filter function defined above to validate uploaded files
});
