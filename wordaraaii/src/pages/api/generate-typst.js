import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// A highly specific prompt to ensure the AI returns only Typst code
const systemPrompt = `You are an expert assistant specializing in the Typst typesetting language.
A user will provide a request for a document.
Your task is to generate the Typst code to fulfill that request.
Your response MUST ONLY be the raw Typst code.
Do not include any explanations, apologies, or markdown formatting like \`\`\`typst.
Just provide the code itself.

Example user request: "A simple hello world document"
Your response:
= Hello, World!
This is a sample document.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemPrompt,
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ typstCode: text });

  } catch (error) {
    console.error('Error in Gemini API call for Typst generation:', error);
    res.status(500).json({ error: 'Failed to generate Typst code from AI' });
  }
}