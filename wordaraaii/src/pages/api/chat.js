// File: pages/api/chat.js

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

export default async function handler(req) { // Changed to just req
  try {
    const { message } = await req.json(); // We'll send a single message now

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Get the streaming response from Google
    const result = await model.generateContentStream(message);

    // Create a new ReadableStream to send to the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        // Await each chunk from the AI's response stream
        for await (const chunk of result.stream) {
          const text = chunk.text();
          // Send the encoded text chunk to the client
          controller.enqueue(encoder.encode(text));
        }
        // Signal that the stream is finished
        controller.close();
      },
    });

    // Return the stream as the response
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error in Gemini API call:', error);
    return new Response('Failed to get response from AI', { status: 500 });
  }
}