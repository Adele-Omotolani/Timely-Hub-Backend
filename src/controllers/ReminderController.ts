// Import Express types for handling HTTP requests and responses in TypeScript
import { Request, Response } from "express";
// Import the Reminder model for database operations related to reminder documents
import { Reminder } from "../models/ReminderModel";
// Import the IUser interface for type-safe user object handling
import { IUser } from "../models/userModel";

// Extend Express Request interface to include authenticated user information
interface AuthRequest extends Request {
  user?: IUser;
}

// Export an asynchronous function to retrieve all reminders for an authenticated user
export const getReminders = async (req: AuthRequest, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during reminder retrieval
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Query the database for all reminders belonging to the authenticated user, sorted by datetime in ascending order
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ datetime: 1 });
    // Return a successful response with the retrieved reminders
    res.status(200).json(reminders);
  } catch (error) {
    // Log any errors that occur during the retrieval process
    console.error("Error fetching reminders:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error fetching reminders" });
  }
};

// Export an asynchronous function to add a new reminder for an authenticated user
export const addReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during reminder creation
  try {
    // Extract title and datetime from the request body
    const { title, datetime } = req.body;

    // Validate that both title and datetime are provided
    if (!title || !datetime) {
      // Return a 400 Bad Request response if required fields are missing
      res.status(400).json({ message: "Title and datetime are required" });
      return;
    }

    // Verify that the user is authenticated
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Create a new Reminder document with the provided data and associate it with the authenticated user
    const newReminder = new Reminder({
      title, // The title of the reminder
      datetime, // The scheduled date and time for the reminder
      userId: req.user._id // Associate the reminder with the user's ID
    });
    // Save the new reminder to the database
    await newReminder.save();

    // Attempt to send an activity notification email for the new reminder
    try {
      // Dynamically import the notification service to avoid circular dependencies
      const { notificationService } = await import('../services/notificationService.js');
      // Send a notification email about the reminder creation activity
      await notificationService.sendActivityNotification(req.user.email, 'reminder', {
        title, // Include reminder title in the notification
        datetime // Include reminder datetime in the notification
      });
    } catch (emailError) {
      // Log any errors that occur during email sending
      console.error('Failed to send reminder notification email:', emailError);
      // Continue with the response even if email sending fails
    }

    // Return a successful response with the created reminder
    res.status(201).json({
      message: "Reminder added successfully",
      reminder: newReminder,
    });
  } catch (error) {
    // Log any errors that occur during the creation process
    console.error("Error adding reminder:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error adding reminder" });
  }
};

// Export an asynchronous function to delete a specific reminder by ID
export const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during reminder deletion
  try {
    // Extract the reminder ID from the request parameters
    const { id } = req.params;
    // Attempt to find and delete the reminder by its ID
    const deleted = await Reminder.findByIdAndDelete(id);

    // Check if the reminder was found and deleted
    if (!deleted) {
      // Return a 404 Not Found response if the reminder doesn't exist
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    // Return a successful response confirming the deletion
    res.status(200).json({ message: "Reminder deleted successfully" });
  } catch (error) {
    // Log any errors that occur during the deletion process
    console.error("Error deleting reminder:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error deleting reminder" });
  }
};

// Export an asynchronous function to update a specific reminder by ID
export const updateReminder = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during reminder update
  try {
    // Extract the reminder ID from the request parameters
    const { id } = req.params;
    // Extract the updated title and datetime from the request body
    const { title, datetime } = req.body;

    // Validate that both title and datetime are provided
    if (!title || !datetime) {
      // Return a 400 Bad Request response if required fields are missing
      res.status(400).json({ message: "Title and datetime are required" });
      return;
    }

    // Attempt to find and update the reminder with the new data
    const updated = await Reminder.findByIdAndUpdate(
      id, // The ID of the reminder to update
      { title, datetime }, // The fields to update
      { new: true } // Return the updated document
    );

    // Check if the reminder was found and updated
    if (!updated) {
      // Return a 404 Not Found response if the reminder doesn't exist
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    // Return a successful response with the updated reminder
    res.status(200).json({ message: "Reminder updated successfully", reminder: updated });
  } catch (error) {
    // Log any errors that occur during the update process
    console.error("Error updating reminder:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error updating reminder" });
  }
};

// Export an asynchronous function to mark a specific reminder as seen
export const markSeen = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during marking as seen
  try {
    // Extract the reminder ID from the request parameters
    const { id } = req.params;
    // Attempt to find and update the reminder's lastSeen field with the current timestamp
    const updated = await Reminder.findByIdAndUpdate(
      id, // The ID of the reminder to update
      { lastSeen: new Date().toISOString() }, // Set lastSeen to current ISO timestamp
      { new: true } // Return the updated document
    );

    // Check if the reminder was found and updated
    if (!updated) {
      // Return a 404 Not Found response if the reminder doesn't exist
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    // Return a successful response with the updated reminder
    res.status(200).json({ message: "Marked as seen", reminder: updated });
  } catch (error) {
    // Log any errors that occur during the marking process
    console.error("Error marking seen:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error marking reminder as seen" });
  }
};

// Export an asynchronous function to reset and populate sample reminders
export const resetSample = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during sample reset
  try {
    // Delete all existing reminders from the database
    await Reminder.deleteMany({});

    // Define sample reminder data for demonstration purposes
    const samples = [
      {
        title: "Morning Workout", // Sample reminder for a morning workout
        datetime: new Date().toISOString(), // Set to current time
      },
      {
        title: "Team Meeting", // Sample reminder for a team meeting
        datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Set to 2 hours from now
      },
    ];

    // Create the sample reminders in the database
    const created = await Reminder.create(samples as any);
    // Return a successful response with the created sample reminders
    res.status(201).json({ message: "Sample reminders added", reminders: created });
  } catch (error) {
    // Log any errors that occur during the sample reset process
    console.error("Error resetting samples:", error);
    // Return a 500 Internal Server Error response with an error message
    res.status(500).json({ message: "Error resetting sample reminders" });
  }
};
