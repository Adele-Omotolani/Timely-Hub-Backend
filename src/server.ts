// Import the Express framework and its types for building the web server
import express, { Express } from "express";
// Load environment variables from a .env file into process.env for configuration
import "dotenv/config";
// Import the database connection function to establish a connection to the database
import { connectedDB } from "./config/Database";
// Import the user router to handle user-related API routes
import { userRouter } from "./routes/userRouter";
// Import CORS middleware to enable Cross-Origin Resource Sharing for frontend-backend communication
import cors from "cors";
// Import chat routes to handle chat-related API endpoints
import chatRoutes from "./routes/chatRoutes";
// Import quiz routes to handle quiz-related API endpoints
import quizRoutes from "./routes/quizRoutes";
// Import upload routes to handle file upload API endpoints
import uploadRoutes from "./routes/uploadRoutes";
// Import reminder router to handle reminder-related API routes
import { reminderRouter } from "./routes/reminderRouter";
// Import activity router to handle activity-related API routes
import activityRouter from "./routes/activityRouter";
// Import the scheduler service to manage scheduled tasks like reminders
import { schedulerService } from "./services/schedulerService";

// Create an instance of the Express application to handle HTTP requests and responses
const app: Express = express();
// Define the port number from environment variables or default to 5040 if not set
const PORT = Number(process.env.PORT) || 5040;

// Middleware section: Configure middleware to process requests before they reach routes

// Commented out: Define allowed origin for CORS from environment or default to localhost for development
// const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
// app.use(
//   cors({
//     origin: allowedOrigin,
//     credentials: true,
//   })
// );

// Enable CORS for all origins to allow cross-origin requests from any domain
app.use(cors());
// Parse incoming JSON payloads in request bodies into JavaScript objects
app.use(express.json());
// Parse URL-encoded data (e.g., from forms) with extended options for complex data structures
app.use(express.urlencoded({ extended: true }));
// Serve static files from the 'uploads' directory at the '/uploads' path for file access
app.use("/uploads", express.static("uploads"));

// Route debugging middleware: Log each incoming request's method and URL with timestamp for debugging purposes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Establish connection to the database using the imported function
connectedDB();
// Mount user router at '/api' path to handle user authentication and management routes
app.use("/api", userRouter);
// Mount chat routes at '/api/chat' path to handle chat-related endpoints
app.use("/api/chat", chatRoutes);
// Mount quiz routes at '/api/quiz' path to handle quiz-related endpoints
app.use("/api/quiz", quizRoutes);
// Mount upload routes at '/api' path to handle file upload endpoints
app.use("/api", uploadRoutes);
// Mount reminder router at '/api/reminders' path to handle reminder management routes
app.use("/api/reminders", reminderRouter);
// Mount activity router at '/api/activities' path to handle activity tracking routes
app.use("/api/activities", activityRouter);

// Basic health check route: Respond with server status and timestamp to verify server is running
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Root route: Provide a welcome message and API base path to avoid 404 on root GET requests
app.get("/", (req, res) => {
  res.json({
    message: "Timely Hub Backend",
    api: "/api",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler: Catch all unmatched routes after all defined routes and return a 404 error
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handler middleware: Catch and handle any errors that occur during request processing
app.use(
  (
    error: any, // The error object thrown during processing
    req: express.Request, // The incoming request object
    res: express.Response, // The response object to send back
    next: express.NextFunction // Function to pass control to the next middleware (not used here)
  ) => {
    // Log the error to the console for debugging
    console.error("Server error:", error);
    // Send a 500 Internal Server Error response with appropriate message
    res.status(500).json({
      message: "Internal server error",
      error:
        // In development mode, include the full error message for debugging; otherwise, hide details
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log the server URL to the console for easy access
  console.log(`our port is here http://localhost:${PORT}`);

  // Start the reminder notification scheduler to handle scheduled tasks
  schedulerService.startScheduler();

  // Log all available API routes for reference
  console.log(`Available routes:`);
  console.log(`  GET  /health`); // Health check endpoint
  console.log(`  GET  /api/getAll`); // Get all users
  console.log(`  GET  /api/getOne/:id`); // Get a specific user by ID
  console.log(`  POST /api/signUp`); // User registration
  console.log(`  POST /api/loginUser`); // User login
  console.log(`  POST /api/logout`); // User logout
  console.log(`  PATCH /api/update/:id`); // Update user information
  console.log(`  DELETE /api/deleteOne/:id`); // Delete a user
  console.log(`  POST /api/chat`); // Create a new chat
  console.log(`  POST /api/chat/message`); // Send a message in a chat
  console.log(`  GET  /api/chat`); // Get all chats
  console.log(`  GET  /api/chat/:chatId`); // Get a specific chat by ID
  console.log(`  DELETE /api/chat/:chatId`); // Delete a chat
  console.log(`  POST /api/quiz`); // Create or submit a quiz
  console.log(`  GET  /api/quiz/history`); // Get quiz history
  console.log(`  GET  /api/quiz/:id`); // Get a specific quiz by ID
  console.log(`  GET  /api/files`); // Get list of uploaded files
  console.log(`  POST /api/upload`); // Upload a file
  console.log(`  DELETE /api/files/:id`); // Delete a file
  console.log(`  GET /api/reminders`); // Get all reminders
  console.log(`  POST /api/reminders`); // Create a new reminder
  console.log(`  DELETE /api/reminders/:id`); // Delete a reminder
  console.log(`  GET /api/activities`); // Get all activities
});
