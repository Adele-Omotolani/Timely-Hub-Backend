// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Document, Schema } from "mongoose";

// Define an interface for a file document, extending Mongoose's Document for database operations
export interface IFile extends Document {
  originalName: string; // The original name of the uploaded file
  mimeType?: string; // Optional MIME type of the file (e.g., 'image/jpeg')
  size?: number; // Optional size of the file in bytes
  url: string; // The public URL where the file can be accessed
  secureUrl?: string; // Optional secure (HTTPS) URL for the file
  publicId: string; // Unique public identifier for the file (often used by cloud storage services like Cloudinary)
  resourceType?: string; // Optional type of resource (e.g., 'image', 'video', 'raw')
  width?: number; // Optional width of the file (for images/videos)
  height?: number; // Optional height of the file (for images/videos)
  userId: string; // The ID of the user who uploaded the file
  createdAt: Date; // Timestamp for when the file record was created
}

// Define a Mongoose schema for the file document, specifying field types, validation, and defaults
const FileSchema = new Schema<IFile>({
  originalName: { type: String, required: true }, // Original name is a required string field
  mimeType: String, // MIME type is an optional string field
  size: Number, // Size is an optional number field
  url: { type: String, required: true }, // URL is a required string field
  secureUrl: String, // Secure URL is an optional string field
  publicId: { type: String, required: true }, // Public ID is a required string field
  resourceType: String, // Resource type is an optional string field
  width: Number, // Width is an optional number field
  height: Number, // Height is an optional number field
  userId: { type: String, required: true }, // User ID is a required string field
  createdAt: { type: Date, default: Date.now }, // Created at defaults to the current date and time
});

// Create and export a Mongoose model for the File collection, using the defined schema and interface
export default mongoose.model<IFile>("File", FileSchema);
