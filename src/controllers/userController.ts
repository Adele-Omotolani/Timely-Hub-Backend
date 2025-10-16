// Import Express framework for building web applications and handling HTTP requests/responses
import express, { Response, Request } from "express";
// Import Mongoose for MongoDB object modeling and interaction
import mongoose from "mongoose";
// Import the user model and schema for database operations related to user documents
import { userModel, userSchema } from "../models/userModel";
// Import Argon2 for secure password hashing and verification
import argon2 from "argon2";
// Import utility function to generate JWT tokens for authentication
import { generateToken } from "../utils/generate";
// Import email verification utilities for user account verification
import { sendVerificationEmail, verifyEmail } from "../utils/emailVerification";

// Export an asynchronous function to retrieve all users from the database
export const getAll = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during user retrieval
  try {
    // Query the database to find all user documents
    const getUsers = await userModel.find();
    // Check if any users were found in the database
    if (!getUsers) {
      // Return a 404 Not Found response if no users exist
      res.status(404).json({ message: "No users found in the database" });
      return;
    }
    // Return a successful response with the retrieved users
    res
      .status(200)
      .json({ message: "Users gotten successfully", data: getUsers });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "AN error occurred", err: err.message });
  }
};

// Export an asynchronous function to retrieve a single user by ID
export const getOne = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during user retrieval
  try {
    // Extract the user ID from the request parameters
    const { id } = req.params;
    // Validate that the user ID is provided
    if (!id) {
      // Return a 400 Bad Request response if ID is missing
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Validate that the provided ID is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Return a 400 Bad Request response for invalid ObjectId format
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    // Query the database to find the user by ID
    const getAUser = await userModel.findById(id);

    // Check if the user was found
    if (!getAUser) {
      // Return a 404 Not Found response if the user doesn't exist
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Return a successful response with the retrieved user data
    res
      .status(200)
      .json({ message: "User gotten successfully", data: getAUser });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

// Export an asynchronous function to handle user registration (sign up)
export const signUp = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during user creation
  try {
    // Extract user registration data from the request body
    const { fullName, email, password, confirmPassword } = req.body;

    // Validate that all required fields are provided
    if (!fullName || !email || !password || !confirmPassword) {
      // Return a 400 Bad Request response if any field is missing
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if a user with the provided email already exists
    const checkIfUserExist = await userModel.findOne({ email });
    if (checkIfUserExist) {
      // Return a 409 Conflict response if the user already exists
      res.status(409).json({ message: "User already exist" });
      return;
    }
    // Verify that the password and confirmation password match
    if (password !== confirmPassword) {
      // Return a 400 Bad Request response if passwords don't match
      res.status(400).json({ message: "Password does not match" });
      return;
    }

    // Validate password length requirements
    if (password.length < 6) {
      // Return a 400 Bad Request response if password is too short
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    // Validate maximum password length
    if (password.length > 12) {
      // Return a 400 Bad Request response if password is too long
      res
        .status(400)
        .json({ message: "Password must be no more than 12 characters" });
      return;
    }

    // Hash the password using Argon2 for secure storage
    const hashPassword = await argon2.hash(password);
    // Create a new user document in the database
    const createUser = await userModel.create({
      fullName, // User's full name
      email, // User's email address
      password: hashPassword, // Hashed password for security
    });

    // Attempt to send a verification email to the new user
    try {
      // Call the email verification utility to send verification email
      await sendVerificationEmail(String(createUser._id));
    } catch (emailError) {
      // Log any errors that occur during email sending
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails, but log the error
    }

    // Return a successful response indicating user creation and email verification requirement
    res.status(201).json({
      message: "User created successfully. Please check your email to verify your account.",
    });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

// Commented out old login function for reference
// export const loginUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       res.status(400).json({ message: "All fields are required" });
//       return;
//     }

//     const findUser = await userModel.findOne({ email });

//     if (!findUser) {
//       res.status(404).json({ message: "User not found" });
//       return;
//     }
//     const isMatch = await argon2.verify(findUser.password, password);
//     if (!isMatch) {
//       res.status(400).json({ message: "Invalid email or password" });
//       return;
//     }

//     const token = generateToken(String(findUser._id), findUser.role)

//     res.status(200).json({
//       message: "Login successful",
//       email: findUser.email,
//       password: findUser.password,
//       token
//     });
//   } catch (err: any) {
//     res.status(500).json({ message: "An error occurred", err: err.message });
//   }
// };

// Export the active asynchronous function to handle user login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during login
  try {
    // Extract login credentials from the request body
    const { email, password } = req.body;

    // Validate that both email and password are provided
    if (!email || !password) {
      // Return a 400 Bad Request response if fields are missing
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Query the database to find the user by email
    const findUser = await userModel.findOne({ email });

    // Check if the user exists
    if (!findUser) {
      // Return a 404 Not Found response if user doesn't exist
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Verify the provided password against the stored hash
    const isMatch = await argon2.verify(findUser.password, password);
    if (!isMatch) {
      // Return a 400 Bad Request response for invalid credentials
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    // Check if the user's email has been verified
    if (!findUser.isEmailVerified) {
      // Return a 403 Forbidden response if email is not verified
      res.status(403).json({ message: "Please verify your email before logging in." });
      return;
    }

    // Generate a JWT token for the authenticated user
    const token = generateToken(String(findUser._id), findUser.role);

    // Create a user object to send back to the client, excluding sensitive information like password
    const user = {
      id: findUser._id, // User's unique identifier
      fullName: findUser.fullName, // User's full name
      email: findUser.email, // User's email address
      role: findUser.role, // User's role (e.g., admin, user)
      // Additional user fields can be added here as needed by the frontend
    };

    // Return a successful login response with token and user data
    res.status(200).json({
      message: "Login successful",
      token, // JWT token for authentication
      user, // User object with relevant information
    });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

// Commented out old update function for reference
// export const update = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { fullName, email, password } = req.body;

//     const findUserToUpdate = await userModel.findByIdAndUpdate(
//       req.params.id,
//       { fullName, email, password },
//       { new: true }
//     );
//     if (!findUserToUpdate) {
//       res.status(404).json({ message: "User not found" });
//       return;
//     }
//     res
//       .status(200)
//       .json({ message: "User updated successfully", data: findUserToUpdate });
//   } catch (err: any) {
//     res.status(500).json({ message: "An error occurred", err: err.message });
//   }
// };

// Export an asynchronous function to update user information
export const update = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during user update
  try {
    // Extract the user ID from the request parameters
    const { id } = req.params;
    // Extract update data from the request body
    const { fullName, email, password, currentPassword } = req.body;

    // Validate that the user ID is provided
    if (!id) {
      // Return a 400 Bad Request response if ID is missing
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Validate that the provided ID is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Return a 400 Bad Request response for invalid ObjectId format
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    // Perform input validation on the backend
    if (!fullName || !email) {
      // Return a 400 Bad Request response if required fields are missing
      res.status(400).json({ message: "Full name and email are required" });
      return;
    }

    // Check that fields are not empty after trimming whitespace
    if (!fullName.trim() || !email.trim()) {
      // Return a 400 Bad Request response for empty fields
      res.status(400).json({ message: "Fields cannot be empty" });
      return;
    }

    // Validate email format using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // Return a 400 Bad Request response for invalid email format
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Check for unique email constraint (ensure no other user has the same email)
    const existingUser = await userModel.findOne({
      email, // Email to check
      _id: { $ne: id }, // Exclude the current user from the search
    });

    if (existingUser) {
      // Return a 409 Conflict response if email is already in use
      res
        .status(409)
        .json({ message: "Email already in use by another account" });
      return;
    }

    // Retrieve the current user document to verify password changes
    const user = await userModel.findById(id);
    if (!user) {
      // Return a 404 Not Found response if user doesn't exist
      res.status(404).json({ message: "User not found" });
      return;
    }

    // If the user is attempting to change their password, verify the current password
    if (password && password.trim() !== "") {
      // Ensure current password is provided for password changes
      if (!currentPassword) {
        // Return a 400 Bad Request response if current password is missing
        res.status(400).json({
          message: "Current password is required to set new password",
        });
        return;
      }

      // Verify that the provided current password matches the stored hash
      const isCurrentPasswordValid = await argon2.verify(
        user.password, // Stored hashed password
        currentPassword // Provided current password
      );
      if (!isCurrentPasswordValid) {
        // Return a 401 Unauthorized response for incorrect current password
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
    }

    // Build the update object with validated data
    const updateData: any = {
      fullName: fullName.trim(), // Trimmed full name
      email: email.trim(), // Trimmed email
    };

    // Only update the password if a new one is provided and verified
    if (password && password.trim() !== "") {
      // Hash the new password before storing
      updateData.password = await argon2.hash(password);
    }

    // Update the user document in the database
    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
    });

    // Double-check that the user was found and updated (handles race conditions)
    if (!updatedUser) {
      // Return a 404 Not Found response if update failed
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Return a successful response with the updated user data (excluding sensitive information)
    res.status(200).json({
      message: "User updated successfully",
      data: {
        id: updatedUser!._id, // User ID
        fullName: updatedUser!.fullName, // Updated full name
        email: updatedUser!.email, // Updated email
      },
    });
  } catch (err: any) {
    // Log the error for debugging purposes
    console.error("Update error:", err);
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

// Export an asynchronous function to delete a user by ID
export const deleteOne = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during user deletion
  try {
    // Extract the user ID from the request parameters
    const { id } = req.params;
    // Validate that the user ID is provided
    if (!id) {
      // Return a 400 Bad Request response if ID is missing
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Validate that the provided ID is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Return a 400 Bad Request response for invalid ObjectId format
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    // Attempt to find and delete the user by ID
    const deleteUser = await userModel.findByIdAndDelete(id);

    // Check if the user was found and deleted
    if (!deleteUser) {
      // Return a 404 Not Found response if the user doesn't exist
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Return a successful response with the deleted user data
    res
      .status(200)
      .json({ message: "User deleted successfully", data: deleteUser });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

// Export an asynchronous function to handle user logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Wrap the entire function in a try-catch block to handle potential errors during logout
  try {
    // For JWT-based authentication, logout is typically handled client-side by removing the token
    // The server-side logout simply returns a success response
    res.status(200).json({ message: "Logout successful" });
  } catch (err: any) {
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};
