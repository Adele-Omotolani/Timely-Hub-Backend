import express from 'express';
// Import the getActivities controller function to handle the route logic
import { getActivities, deleteActivity, clearAllActivities } from '../controllers/activityController';
// Import the protect middleware to ensure the route is authenticated
import { protect } from '../middleware/authMiddleware';

// Create a new Express router instance for defining activity-related routes
const router = express.Router();

// Define a GET route for '/' that requires authentication (protect middleware) and calls getActivities controller
router.get('/', protect, getActivities);

// Define a DELETE route for '/:id' that requires authentication and calls deleteActivity controller
router.delete('/:id', protect, deleteActivity);

// Define a DELETE route for '/clear-all' that requires authentication and calls clearAllActivities controller
router.delete('/clear-all', protect, clearAllActivities);

// Export the router to be used in the main application
export default router;
