// Import the Express framework for creating the router
import express from "express";
// Import quiz controller functions for handling quiz-related operations
import { getQuiz, getAllQuizzes, getQuizById } from "../controllers/quizController";
// Import the multer upload configuration for handling file uploads
import { upload } from "../config/multer";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";

// Create a new Express router instance for defining quiz-related routes
const router = express.Router();

// Define a POST route for "/" to generate or retrieve a quiz, requiring authentication and allowing a single file upload
router.post("/", protect, upload.single("file"), getQuiz);
// Define a GET route for "/history" to retrieve all quizzes for the authenticated user
router.get("/history", protect, getAllQuizzes);
// Define a GET route for "/:id" to retrieve a specific quiz by its ID, requiring authentication
router.get("/:id", protect, getQuizById);

// Export the router to be used in the main application
export default router;
