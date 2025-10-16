// Import Express types for handling HTTP requests and responses in TypeScript
import { Request, Response } from "express";
// Import the generateQuiz function from AI services to create quiz questions
import { generateQuiz } from "../services/aiServices";
// Import OpenAI service for text extraction from uploaded files
import { OpenAIService } from "../utils/openai";
// Import the Quiz model for database operations related to quiz documents
import Quiz from "../models/Quiz";

// Export an asynchronous function to handle quiz generation requests
export const getQuiz = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors during quiz generation
  try {
    // Extract the uploaded file from the request (handled by multer middleware)
    const file = req.file;
    // Extract quiz parameters from the request body
    const { topic, difficulty, numQuestions } = req.body;

    // Initialize variables for content and source
    let content: string | undefined;
    let source: string;

    // Validate that all required parameters are provided
    if (!topic || !difficulty || !numQuestions) {
      // Return a 400 Bad Request response if any required fields are missing
      return res.status(400).json({ message: "Topic, difficulty, and numQuestions are required" });
    }

    // Check if a file was uploaded with the request
    if (file) {
      // Attempt to extract text content from the uploaded file
      try {
        // Use OpenAI service to extract text content from the file buffer
        content = await OpenAIService.extractTextFromBuffer(file.buffer, file.originalname);
        // Set the source to the original filename
        source = file.originalname;
      } catch (fileError) {
        // Log any errors that occur during file processing
        console.error("File processing error:", fileError);
        // Continue with quiz generation without file content if extraction fails
        content = "";
        // Set source to topic or default to "unknown" if topic is not available
        source = topic || "unknown";
      }
    } else {
      // If no file was uploaded, set source to the provided topic
      source = topic;
    }

    // Convert numQuestions to an integer for validation and processing
    const numQuestionsInt = parseInt(numQuestions, 10);
    // Validate that numQuestions is a positive integer
    if (isNaN(numQuestionsInt) || numQuestionsInt <= 0) {
      // Return a 400 Bad Request response if numQuestions is invalid
      return res.status(400).json({ message: "numQuestions must be a positive integer" });
    }

    // Generate quiz questions using the AI service with provided parameters
    const questions = await generateQuiz(content, topic, difficulty, numQuestionsInt);

    // Extract user ID from the authenticated request for database association
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Create a new Quiz document with the generated data
    const quiz = new Quiz({
      topic, // The topic of the quiz
      source, // The source of the quiz content (file name or topic)
      difficulty, // The difficulty level of the quiz
      numQuestions: numQuestionsInt, // The number of questions in the quiz
      questions, // The array of generated quiz questions
      userId, // The ID of the user who created the quiz
    });

    // Save the quiz document to the database
    const savedQuiz = await quiz.save();

    // Attempt to send an activity notification email for the new quiz
    try {
      // Dynamically import the notification service to avoid circular dependencies
      const { notificationService } = await import('../services/notificationService.js');
      // Send a notification email about the quiz creation activity
      await notificationService.sendActivityNotification((req as any).user?.email, 'quiz', {
        topic, // Include quiz topic in the notification
        source, // Include quiz source in the notification
        difficulty, // Include quiz difficulty in the notification
        numQuestions: numQuestionsInt // Include number of questions in the notification
      });
    } catch (emailError) {
      // Log any errors that occur during email sending
      console.error('Failed to send quiz notification email:', emailError);
      // Continue with the response even if email sending fails
    }

    // Return a successful response with the saved quiz data
    res.status(200).json({ message: "Quiz generated and saved successfully", data: savedQuiz });
  } catch (error) {
    // Handle any errors that occurred during the quiz generation process
    if (error instanceof Error) {
      // Return a 500 Internal Server Error response with the error message
      res.status(500).json({ message: "An error occurred", error: error.message });
    } else {
      // Return a generic error response for unknown error types
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

// Export an asynchronous function to retrieve all quizzes for an authenticated user
export const getAllQuizzes = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Extract user ID from the authenticated request
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Query the database for all quizzes belonging to the authenticated user, sorted by creation date (newest first)
    const quizzes = await Quiz.find({ userId }).sort({ createdAt: -1 });
    // Return a successful response with the retrieved quizzes
    res.status(200).json({ message: "Quizzes retrieved successfully", data: quizzes });
  } catch (error) {
    // Handle any errors that occurred during the retrieval process
    if (error instanceof Error) {
      // Return a 500 Internal Server Error response with the error message
      res.status(500).json({ message: "An error occurred", error: error.message });
    } else {
      // Return a generic error response for unknown error types
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

// Export an asynchronous function to retrieve a specific quiz by ID for an authenticated user
export const getQuizById = async (req: Request, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Extract user ID from the authenticated request
    const userId = (req as any).user?.id || (req as any).user?._id;
    // Check if user ID is available (user must be authenticated)
    if (!userId) {
      // Return a 401 Unauthorized response if user ID is missing
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Extract the quiz ID from the request parameters
    const { id } = req.params;
    // Query the database for the specific quiz, ensuring it belongs to the authenticated user
    const quiz = await Quiz.findOne({ _id: id, userId });
    // Check if the quiz exists and belongs to the user
    if (!quiz) {
      // Return a 404 Not Found response if the quiz doesn't exist or doesn't belong to the user
      return res.status(404).json({ message: "Quiz not found" });
    }
    // Return a successful response with the retrieved quiz data
    res.status(200).json({ message: "Quiz retrieved successfully", data: quiz });
  } catch (error) {
    // Handle any errors that occurred during the retrieval process
    if (error instanceof Error) {
      // Return a 500 Internal Server Error response with the error message
      res.status(500).json({ message: "An error occurred", error: error.message });
    } else {
      // Return a generic error response for unknown error types
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
