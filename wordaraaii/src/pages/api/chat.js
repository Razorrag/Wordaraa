// File: pages/api/chat.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

export default async function handler(req, res) {
  try {
    const { messages } = await req.json(); // The Vercel AI SDK sends a `messages` array

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Ask Google for a streaming response
    const streamingResponse = await model.generateContentStream(
      messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))
    );
    
    // Convert the response into a friendly text-stream
    const stream = GoogleGenerativeAIStream(streamingResponse);

    // Respond with the stream
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Error in Gemini API call:', error);
    // Use a Response object for edge runtime errors
    return new Response('Failed to get response from AI', { status: 500 });
  }
}