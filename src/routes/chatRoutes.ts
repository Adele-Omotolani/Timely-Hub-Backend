// Import the Express framework for creating the router
import express from "express";
// Import chat controller functions for handling various chat-related operations
import {
  createChat, // Function to create a new chat
  sendMessage, // Function to send a message in a chat
  getChats, // Function to retrieve all chats for a user
  getChat, // Function to retrieve a specific chat by ID
  deleteChat, // Function to delete a chat by ID
} from "../controllers/chatController";
// Import the multer upload configuration for handling file uploads
import { upload } from "../config/multer";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";

// Create a new Express router instance for defining chat-related routes
const router = express.Router();

// Define a POST route for "/" to create a new chat, requiring authentication
router.post("/", protect, createChat);
// Define a POST route for "/message" to send a message, requiring authentication and allowing a single file upload
router.post("/message", protect, upload.single("file"), sendMessage);
// Define a GET route for "/" to retrieve all chats for the authenticated user
router.get("/", protect, getChats);
// Define a GET route for "/:chatId" to retrieve a specific chat by its ID, requiring authentication
router.get("/:chatId", protect, getChat);
// Define a DELETE route for "/:chatId" to delete a specific chat by its ID, requiring authentication
router.delete("/:chatId", protect, deleteChat);

// Export the router to be used in the main application
export default router;
