// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Document, Schema } from "mongoose";

// Define a type for the role of a message sender, restricting it to predefined values for consistency
export type IRole = "user" | "assistant" | "system";
// Define an interface for a message object, specifying the structure and types of its properties
export interface IMessage {
  role: IRole; // The role of the message sender (user, assistant, or system)
  content: string; // The text content of the message
  fileUrl?: string | undefined; // Optional URL of an attached file
  fileName?: string | undefined; // Optional name of the attached file
  timestamp: Date; // The date and time when the message was created
}

// Define an interface for a chat document, extending Mongoose's Document for database operations
export interface IChat extends Document {
  title: string; // The title of the chat conversation
  messages: IMessage[]; // An array of messages in the chat
  userId: string; // The ID of the user who owns the chat
  createdAt: Date; // Timestamp for when the chat was created (automatically managed by Mongoose)
  updatedAt: Date; // Timestamp for when the chat was last updated (automatically managed by Mongoose)
}

// Define a Mongoose schema for the message subdocument, specifying field types, validation, and defaults
const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant", "system"], required: true }, // Role must be one of the specified values and is required
  content: { type: String, required: true }, // Content is a required string field
  fileUrl: { type: String }, // Optional string field for file URL
  fileName: { type: String }, // Optional string field for file name
  timestamp: { type: Date, default: Date.now }, // Timestamp defaults to the current date and time
});

// Define a Mongoose schema for the chat document, including subdocuments and automatic timestamp management
const chatSchema = new Schema<IChat>(
  {
    title: { type: String, required: true }, // Title is a required string field
    messages: [messageSchema], // Messages is an array of message subdocuments
    userId: { type: String, required: true }, // User ID is a required string field
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields to the schema
  }
);

// Create and export a Mongoose model for the Chat collection, using the defined schema and interface
export default mongoose.model<IChat>("Chat", chatSchema);
