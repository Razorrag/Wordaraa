// File: pages/api/chat.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  // We only want to handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Send the AI's response back to the frontend
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error in Gemini API call:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
}