// Import Express types for Request, Response, and NextFunction to handle HTTP requests and responses
import { Request, Response, NextFunction } from "express";
// Import jsonwebtoken library for JWT token verification and decoding
import jwt from "jsonwebtoken";
// Import the user model to interact with user data in the database
import { userModel } from "../models/userModel";
// Import the IUser interface to type-check user objects
import { IUser } from "../models/userModel";
// Import JwtPayload type from jsonwebtoken for typing decoded JWT payloads
import { JwtPayload } from "jsonwebtoken";
// Import dotenv configuration to load environment variables
import "dotenv/config";

// Define an extended Request interface that includes an optional user property for authenticated requests
interface AuthRequest extends Request {
  user?: IUser; // Optional user property to store authenticated user data
}

// Export an asynchronous middleware function to protect routes by verifying JWT tokens
export const protect = async (
  req: AuthRequest, // Extended request object with user property
  res: Response, // Express response object
  next: NextFunction // Next function to pass control to the next middleware
): Promise<void> => {
  // Extract the Authorization header from the incoming request
  const token = req.header("Authorization");
  // Check if the Authorization header is present
  if (!token) {
    // Return a 401 Unauthorized response if no token is provided
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  // Wrap the token verification logic in a try-catch block to handle potential errors
  try {
    // Retrieve the JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    // Check if the JWT secret is defined in environment variables
    if (!jwtSecret) {
      // Throw an error if JWT_SECRET is not defined to prevent insecure token verification
      throw new Error("JWT_SECRET environment variable is not defined");
    }
    // Verify and decode the JWT token, removing the "Bearer " prefix if present
    const decoded = jwt.verify(
      token.replace("Bearer ", ""), // Remove "Bearer " prefix from token string
      jwtSecret as string // Use the JWT secret for verification
    ) as JwtPayload; // Cast the decoded payload to JwtPayload type
    // Query the database to find the user by ID from the decoded token, excluding the password field
    const user = await userModel
      .findById(decoded.id || decoded._id) // Use either 'id' or '_id' from the token payload
      .select("-password"); // Exclude the password field from the query result for security
    // Check if the user was found in the database
    if (!user) {
      // Return a 404 Not Found response if the user doesn't exist
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Attach the authenticated user to the request object for use in subsequent middleware or route handlers
    req.user = user as IUser;
    // Call the next middleware function in the chain
    next();
  } catch (error) {
    // Return a 401 Unauthorized response if token verification fails or any other error occurs
    res.status(401).json({ message: "Invalid token", error });
  }
};

// Note: In both generateToken and protect functions, add this check: (This appears to be a comment for future implementation)
