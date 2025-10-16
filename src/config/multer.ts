// Import the multer middleware for handling multipart/form-data, primarily for file uploads in Express.js
import multer from "multer";
// Import the path module for handling and transforming file paths (though not used in this file, imported for potential future use)
import path from "path";
// Import dotenv to load environment variables, though not directly used here, it ensures environment configuration is loaded
import dotenv from "dotenv";
// Configure multer to use memory storage, which stores uploaded files in memory as Buffer objects instead of saving to disk
const storage = multer.memoryStorage();

// Export a configured multer instance with specific options for file uploads
export const upload = multer({
  // Use the memory storage configuration defined above
  storage: storage,
  // Set file size limits to prevent excessively large uploads; here limited to 10MB (10 * 1024 * 1024 bytes)
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
