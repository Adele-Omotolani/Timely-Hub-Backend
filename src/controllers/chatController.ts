// Import Express types for handling HTTP requests and responses in TypeScript
import { Request, Response } from "express";
// Import Mongoose for MongoDB object modeling and validation utilities
import mongoose from "mongoose";
// Import Chat model and its interfaces for type-safe database operations
import Chat, { IMessage, IChat } from "../models/Chat";
// Import OpenAI service for AI-powered chat functionality
import { OpenAIService } from "../utils/openai";

// Extend Express Request interface to include authenticated user information
interface AuthRequest extends Request {
  user?: { id: string; email?: string };
}

// Export an asynchronous function to create a new chat session for an authenticated user
export const createChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Create a new chat document in the database with default title and empty messages array
    const newChat = await Chat.create({
      title: "New Chat", // Default title for new chats
      messages: [], // Initialize with empty messages array
      userId: req.user.id, // Associate chat with the authenticated user
    });
    // Return the newly created chat with a 201 Created status
    res.status(201).json(newChat);
  } catch (error) {
    // Return a 500 Internal Server Error response if chat creation fails
    res.status(500).json({ message: "Failed to create chat" });
  }
};

// Export an asynchronous function to retrieve all chats for an authenticated user
export const getChats = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Query the database for all chats belonging to the user, sorted by most recently updated first
    const chats = await Chat.find({ userId: req.user.id }).sort({
      updatedAt: -1, // Sort in descending order of update time
    });
    // Filter out any chats with invalid MongoDB ObjectIds to ensure data integrity
    const validChats = chats.filter((chat) =>
      mongoose.isValidObjectId(chat._id) // Validate ObjectId format
    );
    // Return the filtered list of valid chats as JSON response
    res.json(validChats);
  } catch (error) {
    // Return a 500 Internal Server Error response if fetching chats fails
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

// Export an asynchronous function to retrieve a specific chat by ID for an authenticated user
export const getChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Extract chatId from request parameters
    const { chatId } = req.params;
    // Validate that chatId is provided and is a valid MongoDB ObjectId
    if (!chatId || !mongoose.isValidObjectId(chatId)) {
      // Return a 400 Bad Request response for invalid chat ID
      return res.status(400).json({ message: "Invalid chat ID" });
    }
    // Query the database for the specific chat, ensuring it belongs to the authenticated user
    const chat = await Chat.findOne({
      _id: chatId, // Match the chat ID
      userId: req.user.id, // Ensure ownership by the user
    });
    // Return a 404 Not Found response if the chat doesn't exist or doesn't belong to the user
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    // Return the chat data as JSON response
    res.json(chat);
  } catch (error) {
    // Return a 500 Internal Server Error response if fetching the chat fails
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

// Export an asynchronous function to delete a specific chat for an authenticated user
export const deleteChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Attempt to find and delete the chat, ensuring it belongs to the authenticated user
    const deleted = await Chat.findOneAndDelete({
      _id: req.params.chatId, // Match the chat ID from request parameters
      userId: req.user.id, // Ensure ownership by the user
    });
    // Return a 404 Not Found response if the chat doesn't exist or doesn't belong to the user
    if (!deleted) return res.status(404).json({ message: "Chat not found" });
    // Return a success message as JSON response
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error response if deletion fails
    res.status(500).json({ message: "Failed to delete chat" });
  }
};

// Export an asynchronous function to send a message in a chat, potentially with file attachment and AI response
export const sendMessage = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Extract chatId and message from request body
    const { chatId, message } = req.body;
    // Extract any uploaded file from the request (handled by multer middleware)
    const file = req.file;

    // Log request details for debugging purposes
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    console.log("File object:", file);

    // Validate that both chatId and message are provided
    if (!chatId || !message) {
      // Return a 400 Bad Request response if required fields are missing
      return res.status(400).json({ message: "Chat ID and message required" });
    }

    // Validate message length to prevent abuse and ensure reasonable processing
    if (message.length > 10000) {
      // Return a 400 Bad Request response if message exceeds maximum length
      return res
        .status(400)
        .json({ message: "Message too long (max 10000 characters)" });
    }

    // Initialize variable to hold extracted file content
    let fileContent = "";
    // Check if a file was uploaded with the request
    if (file) {
      // Log file processing details for debugging
      console.log("Processing file:", file.originalname, "size:", file.size, "buffer length:", file.buffer.length);
      try {
        // Use OpenAI service to extract text content from the uploaded file buffer
        fileContent = await OpenAIService.extractTextFromBuffer(
          file.buffer, // File buffer containing the file data
          file.originalname // Original filename for format detection
        );
        // Log successful extraction details
        console.log("File content extracted, length:", fileContent.length);
      } catch (error) {
        // Log any errors during file extraction
        console.error("File extraction error:", error);
        // Continue processing without file content if extraction fails
        fileContent = "";
      }
    }

    // Retrieve the chat from database, ensuring it belongs to the authenticated user
    const chat = await Chat.findOne({ _id: chatId, userId: req.user!.id });
    // Return a 404 Not Found response if chat doesn't exist or doesn't belong to user
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Create a user message object with the message content and optional file content
    const userMessage: IMessage = {
      role: "user", // Indicate this is a user message
      content: fileContent
        ? `${message}\n\nFile Content:\n${fileContent}` // Include file content if available
        : message, // Use message content only if no file
      timestamp: new Date(), // Record the current timestamp
    };

    // Add the user message to the chat's messages array
    chat.messages.push(userMessage);

    // Use OpenAI service to generate an AI response based on the conversation history and file content
    const assistantContent = await OpenAIService.processMessage(
      chat.messages, // Full conversation history
      fileContent // Extracted file content for context
    );

    // Create an assistant message object with the AI-generated response
    const assistantMessage: IMessage = {
      role: "assistant", // Indicate this is an AI assistant message
      content: assistantContent, // The AI-generated response content
      timestamp: new Date(), // Record the current timestamp
    };

    // Add the assistant message to the chat's messages array
    chat.messages.push(assistantMessage);

    // Initialize variable to hold any updated chat title
    let updatedTitle: string | undefined;
    // Check if this is the first message pair and the chat still has the default title
    if (chat.messages.length === 2 && chat.title === "New Chat") {
      try {
        // Generate a descriptive title for the chat based on the first user message
        const generatedTitle = await OpenAIService.generateChatTitle(message);
        // Update the chat title with the generated title
        chat.title = generatedTitle;
        // Store the updated title for response
        updatedTitle = generatedTitle;
      } catch (error) {
        // Log any errors during title generation
        console.error("Title generation error:", error);
        // Keep the default title if generation fails
      }
    }

    // Save the updated chat document to the database
    await chat.save();

    // Send activity notification email for new chat creation
    if (chat.messages.length === 2) { // First message pair (user + assistant)
      try {
        // Dynamically import notification service to avoid circular dependencies
        const { notificationService } = await import('../services/notificationService.js');
        // Check if user has an email address for notifications
        if (req.user.email) {
          // Send notification email about the new chat activity
          await notificationService.sendActivityNotification(req.user.email, 'chat', {
            title: chat.title, // Include chat title in notification
            createdAt: chat.createdAt // Include creation timestamp
          });
        }
      } catch (emailError) {
        // Log any errors during email sending
        console.error('Failed to send chat notification email:', emailError);
        // Don't fail the message sending if email notification fails
      }
    }

    // Return the message exchange details as JSON response
    res.json({
      userMessage, // The user's message
      assistantMessage, // The AI assistant's response
      chatId: chat._id, // The chat ID for reference
      ...(updatedTitle && { title: updatedTitle }), // Include updated title if generated
    });
  } catch (error) {
    // Log any errors that occurred during message processing
    console.error("Chat message error:", error);
    // Extract error message for response, defaulting to generic message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "AI service failed", error: errorMessage });
  }
};
