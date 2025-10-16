// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Document } from "mongoose";

// Define an interface for a user document, extending Mongoose's Document for database operations
export interface IUser extends Document {
  fullName: string; // The full name of the user
  email: string; // The email address of the user, used for login and verification
  password: string; // The hashed password for user authentication
  role: string; // The role of the user (e.g., 'myUsers' for regular users)
  isEmailVerified: boolean; // Flag indicating if the user's email has been verified
  emailVerificationToken?: string; // Optional token for email verification process
  emailVerificationExpires?: Date; // Optional expiration date for the email verification token
}

// Define a Mongoose schema for the user document, specifying field types, validation, and defaults
export const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: { type: String, required: true }, // Full name is a required string field
    email: { type: String, required: true, unique: true }, // Email is a required, unique string field
    password: { type: String, required: true }, // Password is a required string field
    role: { type: String, default: "myUsers" }, // Role defaults to "myUsers" if not specified
    isEmailVerified: { type: Boolean, default: false }, // Email verification flag defaults to false
    emailVerificationToken: { type: String }, // Optional string field for verification token
    emailVerificationExpires: { type: Date }, // Optional date field for token expiration
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields to the schema
);

// Create and export a Mongoose model for the myUsers collection, using the defined schema and interface
export const userModel = mongoose.model<IUser>("myUsers", userSchema);
