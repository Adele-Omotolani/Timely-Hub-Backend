// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Schema, Document } from 'mongoose';

// Define an interface for a quiz document, extending Mongoose's Document for database operations
export interface IQuiz extends Document {
  topic?: string; // Optional topic or subject of the quiz
  source: string; // The source of the quiz content (e.g., topic name or file name)
  difficulty: string; // Difficulty level of the quiz (e.g., 'easy', 'medium', 'hard')
  numQuestions: number; // Number of questions in the quiz
  questions: { // Array of question objects
    question: string; // The question text
    options: { A: string; B: string; C: string; D: string }; // Multiple choice options labeled A, B, C, D
    answer: "A" | "B" | "C" | "D"; // The correct answer key
    explanation: string; // Explanation for the correct answer
  }[];
  userId: string; // The ID of the user who created or owns the quiz
  createdAt: Date; // Timestamp for when the quiz was created (automatically managed by Mongoose)
  updatedAt: Date; // Timestamp for when the quiz was last updated (automatically managed by Mongoose)
}

// Define a Mongoose schema for the quiz document, specifying field types, validation, and defaults
const QuizSchema: Schema = new Schema({
  topic: { type: String }, // Topic is an optional string field
  source: { type: String, required: true }, // Source is a required string field
  difficulty: { type: String, required: true }, // Difficulty is a required string field
  numQuestions: { type: Number, required: true }, // Number of questions is a required number field
  userId: { type: String, required: true }, // User ID is a required string field
  questions: [{ // Questions is an array of subdocuments
    question: { type: String, required: true }, // Question text is a required string field
    options: { // Options is an object with required string fields for each choice
      A: { type: String, required: true }, // Option A is a required string field
      B: { type: String, required: true }, // Option B is a required string field
      C: { type: String, required: true }, // Option C is a required string field
      D: { type: String, required: true }, // Option D is a required string field
    },
    answer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] }, // Answer must be one of the specified enum values and is required
    explanation: { type: String, required: true }, // Explanation is a required string field
  }],
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields to the schema
});

// Create and export a Mongoose model for the Quiz collection, using the defined schema and interface
export default mongoose.model<IQuiz>('Quiz', QuizSchema);
