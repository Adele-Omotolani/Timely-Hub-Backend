// Import Express types for handling HTTP requests and responses in TypeScript
import { Request, Response } from "express";
// Import the File model for database operations related to file documents
import FileModel from "../models/File";
// Import the utility function to upload file buffers to Cloudinary
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";
// Import the Cloudinary configuration for file deletion operations
import cloudinary from "../utils/cloudinary";

// Export an asynchronous function to retrieve all files for an authenticated user
export const getFiles = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors during file retrieval
  try {
    // Extract user ID from the authenticated request (supporting both 'id' and '_id' formats)
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Query the database for all files belonging to the authenticated user, sorted by creation date (newest first)
    const files = await FileModel.find({ userId }).sort({ createdAt: -1 });
    // Return a successful response with the retrieved files
    res
      .status(200)
      .json({ message: "Files retrieved successfully", data: files });
  } catch (error) {
    // Log any errors that occur during the retrieval process
    console.error("Get files error:", error);
    // Return a 500 Internal Server Error response with error details
    res
      .status(500)
      .json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
};

// Export an asynchronous function to upload multiple files for an authenticated user
export const uploadFiles = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors during file upload
  try {
    // Extract user ID from the authenticated request
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Extract uploaded files from the request (handled by multer middleware)
    const files = req.files as Express.Multer.File[] | undefined;
    // Check if any files were uploaded
    if (!files || files.length === 0) {
      // Return a 400 Bad Request response if no files were provided
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Retrieve the Cloudinary folder name from environment variables
    const folder = process.env.CLOUDINARY_FOLDER;

    // Create an array of promises for uploading each file concurrently
    const uploadPromises = files.map(async (file) => {
      // Generate a unique base name for the file by removing the extension and appending a timestamp
      const nameBase = `${file.originalname.replace(
        /\.[^/.]+$/,
        ""
      )}-${Date.now()}`;

      // Upload the file buffer to Cloudinary using the utility function
      const result = await uploadBufferToCloudinary(
        file.buffer, // The file buffer from multer
        nameBase, // The unique name base for the file
        folder // The Cloudinary folder to upload to
      );

      // Create a new file document in the database with the upload result details
      const savedFile = await FileModel.create({
        originalName: file.originalname, // Original filename from the upload
        mimeType: file.mimetype, // MIME type of the file
        size: file.size, // Size of the file in bytes
        url: result.secure_url || result.url, // Public URL of the uploaded file
        secureUrl: result.secure_url, // Secure HTTPS URL of the uploaded file
        publicId: result.public_id, // Cloudinary public ID for the file
        resourceType: result.resource_type, // Type of resource (image, video, etc.)
        width: result.width, // Width of the image/video (if applicable)
        height: result.height, // Height of the image/video (if applicable)
        userId, // Associate the file with the authenticated user
      });

      // Return the saved file document
      return savedFile;
    });

    // Wait for all file uploads to complete
    const savedFiles = await Promise.all(uploadPromises);

    // Attempt to send activity notification emails for each uploaded file
    try {
      // Dynamically import the notification service to avoid circular dependencies
      const { notificationService } = await import('../services/notificationService.js');
      // Loop through each saved file and send a notification email
      for (const file of savedFiles) {
        await notificationService.sendActivityNotification((req as any).user?.email, 'file', {
          originalName: file.originalName, // Include original filename in notification
          mimeType: file.mimeType, // Include MIME type in notification
          size: file.size // Include file size in notification
        });
      }
    } catch (emailError) {
      // Log any errors that occur during email sending
      console.error('Failed to send file upload notification email:', emailError);
      // Continue with the response even if email sending fails
    }

    // Return a successful response with the uploaded files data
    res
      .status(201)
      .json({ message: "Files uploaded successfully", data: savedFiles });
  } catch (error) {
    // Log any errors that occur during the upload process
    console.error("Upload error:", error);
    // Return a 500 Internal Server Error response with error details
    res
      .status(500)
      .json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
};

// Export an asynchronous function to delete a specific file by ID for an authenticated user
export const deleteFile = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors during file deletion
  try {
    // Extract user ID from the authenticated request
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Extract the file ID from the request parameters
    const { id } = req.params;
    // Validate that the file ID is provided
    if (!id) {
      // Return a 400 Bad Request response if file ID is missing
      return res.status(400).json({ message: "File ID is required" });
    }

    // Query the database for the specific file, ensuring it belongs to the authenticated user
    const file = await FileModel.findOne({ _id: id, userId });
    // Check if the file exists and belongs to the user
    if (!file) {
      // Return a 404 Not Found response if the file doesn't exist or doesn't belong to the user
      return res.status(404).json({ message: "File not found" });
    }

    // Delete the file from Cloudinary if it has a public ID
    if (file.publicId) {
      // Use Cloudinary's destroy method to remove the file from cloud storage
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType || "image", // Specify resource type, defaulting to "image"
      });
    }

    // Delete the file document from the database
    await FileModel.findByIdAndDelete(id);

    // Return a successful response confirming the deletion
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    // Log any errors that occur during the deletion process
    console.error("Delete file error:", error);
    // Return a 500 Internal Server Error response with error details
    res
      .status(500)
      .json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
};
