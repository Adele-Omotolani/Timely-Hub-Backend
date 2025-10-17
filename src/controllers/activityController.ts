// Import Express types for request and response handling in TypeScript
import { Request, Response } from "express";
// Import the Reminder model to interact with reminder documents in the database
import { Reminder } from "../models/ReminderModel";
// Import the Quiz model to interact with quiz documents in the database
import Quiz from "../models/Quiz";
// Import the Chat model to interact with chat documents in the database
import Chat from "../models/Chat";
// Import the File model to interact with file documents in the database
import FileModel from "../models/File";
// Import the IUser interface to type-check user objects
import { IUser } from "../models/userModel";

// Extend the Express Request interface to include an optional user property for authenticated requests
interface AuthRequest extends Request {
  user?: IUser;
}

// Define an interface for Activity objects to standardize the structure of activity data returned to the client
interface Activity {
  id: string; // Unique identifier for the activity
  type: 'reminder' | 'quiz' | 'chat' | 'file'; // Type of activity to categorize it
  title: string; // Main title or name of the activity
  description?: string; // Optional description providing more details about the activity
  timestamp: string; // Timestamp for sorting and displaying when the activity occurred
  details: any; // Additional metadata specific to the activity type
  createdAt: string; // ISO string of when the activity was created
}

// Export an asynchronous function to handle GET requests for retrieving user activities
export const getActivities = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle any errors that may occur
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // If not authenticated, return a 401 Unauthorized response
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Extract the user ID from the authenticated user object, casting to any for flexibility
    const userId = (req.user as any).id;

    // Fetch all activities for the user concurrently using Promise.all for better performance
    const [reminders, quizzes, chats, files] = await Promise.all([
      // Fetch reminders sorted by datetime in descending order (most recent first)
      Reminder.find({ userId }).sort({ datetime: -1 }),
      // Fetch quizzes sorted by creation date in descending order
      Quiz.find({ userId }).sort({ createdAt: -1 }),
      // Fetch chats sorted by last update time in descending order
      Chat.find({ userId }).sort({ updatedAt: -1 }),
      // Fetch files sorted by creation date in descending order
      FileModel.find({ userId }).sort({ createdAt: -1 })
    ]);

    // Initialize an empty array to hold normalized activity objects
    const activities: Activity[] = [];

    // Process reminders and convert them to Activity format
    reminders.forEach(reminder => {
      activities.push({
        id: (reminder._id as any).toString(), // Convert MongoDB ObjectId to string
        type: 'reminder', // Set activity type
        title: reminder.title, // Use reminder title
        description: `Reminder scheduled for ${new Date(reminder.datetime).toLocaleString()}`, // Format datetime for display
        timestamp: reminder.datetime, // Use reminder datetime for sorting
        details: { // Include additional reminder metadata
          lastSeen: reminder.lastSeen,
          createdAt: reminder.createdAt
        },
        createdAt: reminder.createdAt.toISOString() // Convert to ISO string
      });
    });

    // Process quizzes and convert them to Activity format
    quizzes.forEach(quiz => {
      activities.push({
        id: (quiz._id as any).toString(), // Convert MongoDB ObjectId to string
        type: 'quiz', // Set activity type
        title: quiz.topic || quiz.source, // Use topic or source as title
        description: `${quiz.numQuestions} questions, ${quiz.difficulty} difficulty`, // Describe quiz parameters
        timestamp: quiz.createdAt.toISOString(), // Use creation time for sorting
        details: { // Include quiz metadata
          source: quiz.source,
          difficulty: quiz.difficulty,
          numQuestions: quiz.numQuestions
        },
        createdAt: quiz.createdAt.toISOString() // Convert to ISO string
      });
    });

    // Process chats and convert them to Activity format
    chats.forEach(chat => {
      // Get the last message if it exists, otherwise null
      const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
      activities.push({
        id: (chat._id as any).toString(), // Convert MongoDB ObjectId to string
        type: 'chat', // Set activity type
        title: chat.title, // Use chat title
        description: lastMessage ? `Last message: ${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}` : 'New chat', // Truncate last message or indicate new chat
        timestamp: chat.updatedAt.toISOString(), // Use last update time for sorting
        details: { // Include chat metadata
          messageCount: chat.messages.length,
          lastMessageAt: lastMessage?.timestamp.toISOString()
        },
        createdAt: chat.createdAt.toISOString() // Convert to ISO string
      });
    });

    // Process files and convert them to Activity format
    files.forEach(file => {
      activities.push({
        id: (file._id as any).toString(), // Convert MongoDB ObjectId to string
        type: 'file', // Set activity type
        title: file.originalName, // Use original file name
        description: `${file.mimeType}, ${((file.size || 0) / 1024).toFixed(1)} KB`, // Show file type and size in KB
        timestamp: file.createdAt.toISOString(), // Use creation time for sorting
        details: { // Include file metadata
          mimeType: file.mimeType,
          size: file.size,
          url: file.url
        },
        createdAt: file.createdAt.toISOString() // Convert to ISO string
      });
    });

    // Sort all activities by timestamp in descending order (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Send a successful response with the sorted activities array
    res.status(200).json(activities);

  } catch (error) {
    // Log any errors that occurred during processing
    console.error("Error fetching activities:", error);
    // Send a 500 Internal Server Error response with error details
    res.status(500).json({
      message: "Error fetching activities",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
// Export an asynchronous function to handle DELETE requests for deleting a specific activity
export const deleteActivity = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const userId = (req.user as any).id;
    const activityId = req.params.id;

    // Try to delete from each collection
    const [reminderDeleted, quizDeleted, chatDeleted, fileDeleted] = await Promise.all([
      Reminder.findOneAndDelete({ _id: activityId, userId }),
      Quiz.findOneAndDelete({ _id: activityId, userId }),
      Chat.findOneAndDelete({ _id: activityId, userId }),
      FileModel.findOneAndDelete({ _id: activityId, userId })
    ]);

    if (reminderDeleted || quizDeleted || chatDeleted || fileDeleted) {
      res.status(200).json({ message: 'Activity deleted successfully' });
    } else {
      res.status(404).json({ message: 'Activity not found' });
    }

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      message: 'Error deleting activity',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export an asynchronous function to handle DELETE requests for clearing all activities
export const clearAllActivities = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const userId = (req.user as any).id;
    const userObjectId = (req.user as any)._id || userId; // Get ObjectId for Reminder model

    // Delete activities from each collection individually to handle failures gracefully
    const results = {
      reminders: { success: false, count: 0, error: null as any },
      quizzes: { success: false, count: 0, error: null as any },
      chats: { success: false, count: 0, error: null as any },
      files: { success: false, count: 0, error: null as any }
    };

    // Delete reminders (uses ObjectId)
    try {
      const reminderResult = await Reminder.deleteMany({ userId: userObjectId });
      results.reminders = { success: true, count: reminderResult.deletedCount || 0, error: null };
    } catch (error) {
      console.error('Error deleting reminders:', error);
      results.reminders.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Delete quizzes (uses string)
    try {
      const quizResult = await Quiz.deleteMany({ userId });
      results.quizzes = { success: true, count: quizResult.deletedCount || 0, error: null };
    } catch (error) {
      console.error('Error deleting quizzes:', error);
      results.quizzes.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Delete chats (uses string)
    try {
      const chatResult = await Chat.deleteMany({ userId });
      results.chats = { success: true, count: chatResult.deletedCount || 0, error: null };
    } catch (error) {
      console.error('Error deleting chats:', error);
      results.chats.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Delete files (uses string)
    try {
      const fileResult = await FileModel.deleteMany({ userId });
      results.files = { success: true, count: fileResult.deletedCount || 0, error: null };
    } catch (error) {
      console.error('Error deleting files:', error);
      results.files.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Calculate total deleted
    const totalDeleted = results.reminders.count + results.quizzes.count + results.chats.count + results.files.count;

    // Check if any deletions were successful
    const hasSuccess = results.reminders.success || results.quizzes.success || results.chats.success || results.files.success;

    if (hasSuccess) {
      res.status(200).json({
        message: `Activities cleared successfully. Total deleted: ${totalDeleted}`,
        details: results
      });
    } else {
      res.status(500).json({
        message: 'Failed to clear any activities',
        details: results
      });
    }

  } catch (error) {
    console.error('Error clearing activities:', error);
    res.status(500).json({
      message: 'Error clearing activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
