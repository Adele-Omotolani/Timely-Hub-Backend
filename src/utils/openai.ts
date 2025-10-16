import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import path from "path";
const pdf = require("pdf-parse");
import dotenv from "dotenv";
dotenv.config();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class OpenAIService {
  static async processMessage(messages: any[], fileContent?: string) {
    console.log("processMessage called with fileContent length:", fileContent?.length);
    try {
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // If there's file content, prepend it to the last user message
      if (fileContent && messageHistory.length > 0) {
        const lastUserMessage = messageHistory[messageHistory.length - 1];
        if (lastUserMessage) {
          lastUserMessage.content = `File content: ${fileContent}\n\nUser question: ${lastUserMessage.content}`;
        }
      }

      console.log("Calling generateText with messages:", messageHistory.map(m => ({ role: m.role, content: m.content.substring(0, 100) })));
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        messages: messageHistory,
        temperature: 0.7,
      });

      console.log("generateText returned text length:", text?.length);
      return text || "Sorry, I could not process your request.";
    } catch (error: any) {
      console.error("OpenAI API error:", error);

      if (error.status === 401) {
        throw new Error("Invalid OpenAI API key");
      } else if (error.status === 429) {
        throw new Error("OpenAI API rate limit exceeded");
      } else if (error.status === 500) {
        throw new Error("OpenAI server error");
      } else {
        // Instead of throwing, return a default message to avoid blocking the message
        console.error("Failed to process message with OpenAI, returning default response");
        return "Sorry, I could not process your request due to an error.";
      }
    }
  }

  static async extractTextFromFile(filePath: string): Promise<string> {
    try {
      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".txt") {
        return fs.readFileSync(filePath, "utf-8");
      } else if (ext === ".pdf") {
        // PDF processing with pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        return "Image file detected. For image processing, use OpenAI Vision API.";
      } else if ([".doc", ".docx"].includes(ext)) {
        // Word document processing with mammoth
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else {
        return `File type ${ext} detected. Content extraction not implemented.`;
      }
    } catch (error) {
      console.error("File extraction error:", error);
      throw new Error("Failed to extract text from file");
    }
  }

  static async extractTextFromBuffer(buffer: Buffer, originalname: string): Promise<string> {
    try {
      const ext = path.extname(originalname).toLowerCase();

      if (ext === ".txt") {
        return buffer.toString("utf-8");
      } else if (ext === ".pdf") {
        // PDF processing with pdf-parse
        const data = await pdf(buffer);
        return data.text;
      } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        return "Image file detected. For image processing, use OpenAI Vision API.";
      } else if ([".doc", ".docx"].includes(ext)) {
        // Word document processing with mammoth
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else {
        return `File type ${ext} detected. Content extraction not implemented.`;
      }
    } catch (error) {
      console.error("Buffer extraction error:", error);
      throw new Error("Failed to extract text from buffer");
    }
  }

  static async generateChatTitle(message: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "system",
            content: "Generate a short, concise title (max 50 characters) for a chat conversation based on the user's first message. Make it descriptive and relevant.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.3,
      });

      return text?.trim() || "New Chat";
    } catch (error: any) {
      console.error("OpenAI title generation error:", error);
      return "New Chat";
    }
  }
}
