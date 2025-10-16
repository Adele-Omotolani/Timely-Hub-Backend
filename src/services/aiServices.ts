import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
}

export const generateQuiz = async (
  content: string | undefined,
  topic: string | undefined,
  difficulty: string,
  numQuestions: number
): Promise<QuizQuestion[]> => {
  if (!content && !topic) {
    throw new Error("Either content or topic must be provided");
  }

  const context = content ? `based on the following content:\n${content}` : `on the topic "${topic}"`;

  const prompt = `
Generate a ${numQuestions} question multiple-choice quiz ${context} at ${difficulty} difficulty.
For each question, provide:
- The question text
- Four options labeled A, B, C, D
- The correct answer letter
- A brief explanation of why the answer is correct

Format as JSON array:
[
  {
    "question": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "A",
    "explanation": "..."
  },
  ...
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Try to parse the response as JSON
    const match = responseText.match(/\[.*\]/s);
    if (match) {
      return JSON.parse(match[0]);
    } else {
      throw new Error("Quiz format not found in OpenAI response");
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(
      error.message || "Failed to generate quiz from OpenAI"
    );
  }
};
