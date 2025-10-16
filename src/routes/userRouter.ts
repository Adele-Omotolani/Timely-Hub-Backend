// Import Express framework and Router type for creating the router
import express, {Router} from "express";
// Import user controller functions for handling user-related operations
import { getAll, getOne, signUp, loginUser, update, deleteOne, logout } from "../controllers/userController";
// Import getActivities controller function for retrieving user activities
import { getActivities } from "../controllers/activityController";
// Import protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";
// Import verifyEmail utility function for email verification
import { verifyEmail } from "../utils/emailVerification";

// Create and export a new Express router instance for defining user-related routes
export const userRouter: Router = express.Router();

// Define a GET route for "/getAll" to retrieve all users
userRouter.get("/getAll", getAll);
// Define a GET route for "/getOne/:id" to retrieve a specific user by ID
userRouter.get("/getOne/:id", getOne);
// Define a POST route for "/signUp" to register a new user
userRouter.post("/signUp", signUp);
// Define a POST route for "/loginUser" to authenticate and log in a user
userRouter.post("/loginUser", loginUser);
// Define a POST route for "/logout" to log out the current user
userRouter.post("/logout", logout);
// Define a PATCH route for "/update/:id" to update a specific user by ID
userRouter.patch("/update/:id", update);
// Define a DELETE route for "/deleteOne/:id" to delete a specific user by ID
userRouter.delete("/deleteOne/:id", deleteOne);
// Define a GET route for "/activities" to retrieve activities for the authenticated user
userRouter.get("/activities", protect, getActivities);
// Define a GET route for "/verify-email" to verify a user's email using a token
userRouter.get("/verify-email", async (req, res) => {
  // Extract the token from query parameters
  const { token } = req.query;
  // Validate that the token is provided and is a string
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Verification token is required' });
  }

  // Call the verifyEmail function with the token
  const result = await verifyEmail(token);
  // Respond based on the verification result
  if (result.success) {
    res.status(200).json({ success: true, message: result.message });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});
