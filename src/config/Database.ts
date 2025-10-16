// Import Mongoose library for MongoDB object modeling and its types for TypeScript support
import mongoose, { Mongoose } from "mongoose";
// Load environment variables from .env file into process.env for secure configuration access
import "dotenv/config"

// Export an asynchronous function to establish a connection to the MongoDB database
export const connectedDB = async (): Promise<void> => {
    // Retrieve the MongoDB connection URL from environment variables for security and flexibility
    const MONGODB_URL = process.env.MONGODB_URL
    // Check if the MongoDB URL is provided; if not, log an error and throw an exception to prevent connection attempts
    if(!MONGODB_URL){
        console.error("MISSING MONGODB_URL IN DOTENV")
        throw new Error("Missing MONGODB_URL")

    }
    // Attempt to connect to the MongoDB database using the provided URL
    try{
    await mongoose.connect(MONGODB_URL)
    // Log a success message to the console upon successful connection
    console.log("Connected to database");

    }
    // Catch any errors that occur during the connection attempt
    catch(err:any){
        // Log the error details to the console for debugging purposes
        console.error("Could not connect to database", err)
        // Re-throw the error to allow calling code to handle it appropriately
        throw err
    }
}


