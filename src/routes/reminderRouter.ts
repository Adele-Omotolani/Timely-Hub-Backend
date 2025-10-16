// Import Express framework and Router type for creating the router
import express, { Router } from 'express';
// Import reminder controller functions for handling CRUD operations on reminders
import { addReminder, deleteReminder, getReminders, markSeen, resetSample, updateReminder } from '../controllers/ReminderController';
// Import notification service for sending emails
import { notificationService } from '../services/notificationService';
// Import scheduler service for managing scheduled tasks
import { schedulerService } from '../services/schedulerService';
// Import protect middleware to ensure routes are authenticated
import { protect } from '../middleware/authMiddleware';

// Create and export a new Express router instance for reminder-related routes
export const reminderRouter:Router = express.Router();

// Define a GET route for "/" to retrieve all reminders for the authenticated user
reminderRouter.get("/", protect, getReminders);
// Define a POST route for "/" to add a new reminder, requiring authentication
reminderRouter.post("/", protect, addReminder);
// Define a PUT route for "/:id" to update a specific reminder by its ID
reminderRouter.put("/:id", updateReminder);
// Define a PUT route for "/:id/seen" to mark a specific reminder as seen
reminderRouter.put("/:id/seen", markSeen);
// Define a DELETE route for "/:id" to delete a specific reminder by its ID
reminderRouter.delete("/:id", deleteReminder);
// Define a POST route for "/reset" to reset sample reminders
reminderRouter.post("/reset", resetSample);

// Test routes for email notifications (not protected for testing purposes)
reminderRouter.post("/test-email", async (req, res) => {
  try {
    // Extract email from request body
    const { email } = req.body;
    // Validate that email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Send test email using notification service
    await notificationService.sendTestEmail(email);
    // Respond with success message
    res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    // Log error and respond with failure message
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Failed to send test email", error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test route for triggering manual scheduler check (not protected for testing purposes)
reminderRouter.post("/test-scheduler", async (req, res) => {
  try {
    // Trigger manual check using scheduler service
    await schedulerService.triggerManualCheck();
    // Respond with success message
    res.status(200).json({ message: "Manual scheduler check triggered" });
  } catch (error) {
    // Log error and respond with failure message
    console.error("Error triggering manual check:", error);
    res.status(500).json({ message: "Failed to trigger manual check", error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
