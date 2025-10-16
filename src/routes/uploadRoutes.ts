// Import the Express framework for creating the router
import express from "express";
// Import the upload middleware for handling file uploads
import { upload } from "../middleware/uploadMiddleware";
// Import upload controller functions for handling file operations
import {
  getFiles, // Function to retrieve all uploaded files
  uploadFiles, // Function to handle file uploads
  deleteFile, // Function to delete a specific file
} from "../controllers/uploadController";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";

// Create a new Express router instance for defining upload-related routes
const router = express.Router();

// Define a GET route for "/files" to fetch all uploaded files for the frontend UI, requiring authentication
router.get("/files", protect, getFiles);

// Define a POST route for "/upload" with field name 'files', using upload.array to accept up to 10 files, requiring authentication
router.post("/upload", protect, upload.array("files", 10), uploadFiles);

// Define a DELETE route for "/files/:id" to delete a specific file by its ID, requiring authentication
router.delete("/files/:id", protect, deleteFile);

// Export the router to be used in the main application
export default router;
