// src/pages/api/fix-latex.js

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Set the runtime to edge for Next.js Pages Router API routes
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    if (!process.env.GOOGLE_API_KEY) {
      return new Response('Server misconfiguration: GOOGLE_API_KEY is missing', { status: 500 });
    }
    const { code, errorLog } = await req.json();

    if (!code || !errorLog) {
      return new Response('LaTeX code and error log are required', { status: 400 });
    }
    
    const prompt = `You are an expert LaTeX debugger. Your task is to fix the provided LaTeX code based on the compilation error log.

**Instructions:**
1.  Analyze the error log to understand the problem. Common errors include missing packages, undefined control sequences, mismatched braces, or syntax errors.
2.  Correct the LaTeX code to resolve the error. Do NOT add features or change the content, only fix the compilation issue.
3.  The output MUST be only the raw, corrected LaTeX code. Do NOT include any explanations, comments, or markdown fences (like \`\`\`latex\`). The output must be ready to compile directly.

**LaTeX Code with Error:**
---
${code}
---

**Compilation Error Log:**
---
${errorLog}
---

**Corrected LaTeX Code:**
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error in LaTeX fixing API call:', error);
    return new Response('Failed to get fix from AI', { status: 500 });
  }
}