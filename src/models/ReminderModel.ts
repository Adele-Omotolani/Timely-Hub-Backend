// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Schema, Document } from "mongoose";

// Define an interface for a reminder document, extending Mongoose's Document for database operations
export interface IReminder extends Document {
  title: string; // The title or description of the reminder
  datetime: string; // The scheduled date and time for the reminder as a string
  userId: mongoose.Types.ObjectId; // Reference to the user who created the reminder
  createdAt: Date; // Timestamp for when the reminder was created (automatically managed by Mongoose)
  lastSeen?: string; // Optional timestamp for when the reminder was last viewed or acknowledged
  notified?: boolean; // Optional flag indicating if a notification has been sent for this reminder
}

// Define a Mongoose schema for the reminder document, specifying field types, validation, and defaults
const reminderSchema = new Schema<IReminder>(
  {
    title: { type: String, required: true }, // Title is a required string field
    datetime: { type: String, required: true }, // Datetime is a required string field
    userId: { type: Schema.Types.ObjectId, ref: "myUsers", required: true }, // User ID is a required ObjectId field referencing the "myUsers" collection
    lastSeen: { type: String }, // Last seen is an optional string field
    notified: { type: Boolean, default: false }, // Notified is an optional boolean field defaulting to false
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields to the schema
);

// Create and export a Mongoose model for the Reminder collection, using the defined schema and interface
export const Reminder = mongoose.model<IReminder>("Reminder", reminderSchema);
