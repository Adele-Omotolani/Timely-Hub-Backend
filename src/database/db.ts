// Import Mongoose, an Object Data Modeling (ODM) library for MongoDB and Node.js, providing schema-based solutions for modeling application data
import mongoose from "mongoose";
// Import dotenv to load environment variables from a .env file into process.env
import dotenv from "dotenv";
// Load environment variables from the .env file into the application
dotenv.config();

// Retrieve the MongoDB connection URL from environment variables, ensuring it's treated as a string
const MONGO_URL = process.env.MONGODB_URL as string;

// Define an asynchronous function to establish a connection to the MongoDB database
const database = async () => {
  // Wrap the connection attempt in a try-catch block to handle potential errors gracefully
  try {
    // Attempt to connect to the MongoDB database using the provided URL
    await mongoose.connect(MONGO_URL);
    // Log a success message to the console if the connection is established
    console.log("Connected to database");
  } catch (error) {
    // Log an error message to the console if the connection fails, including the error details
    console.error("Connection failed", error);
    // Exit the Node.js process with a failure code (1) to indicate an error occurred
    process.exit(1);
  }
};

// Export the database connection function as the default export for use in other parts of the application
export default database;
