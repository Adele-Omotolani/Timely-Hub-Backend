// Interacts with Cohere API for embeddings and chat
import axios from "axios";

const COHERE_API_KEY = process.env.COHERE_API_KEY;

export const embedText = async (text: string): Promise<number[]> => {
  const response = await axios.post(
    "https://api.cohere.ai/embed",
    {
      texts: [text],
      model: "embed-english-v2.0",
    },
    {
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
      },
    }
  );
  return response.data.embeddings[0];
};
