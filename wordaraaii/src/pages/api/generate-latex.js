// src/pages/api/generate-latex.js

import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const { content } = await req.json();

    if (!content) {
      return new Response('Content is required', { status: 400 });
    }
    
    // An improved, more specific prompt for better and more reliable LaTeX code.
    const prompt = `You are an expert LaTeX document creator. Your task is to convert the following text or markdown content into a complete, well-structured, and beautifully formatted LaTeX document that compiles with pdfLaTeX.

**Instructions:**
1.  The output MUST be only the raw LaTeX code. Do NOT include any explanations, comments, or markdown fences (like \`\`\`latex\`). The output must be ready to compile directly.
2.  Start the document with \`\\documentclass{article}\`.
3.  **Crucially, include modern and essential packages.** Always include \`\\usepackage[utf8]{inputenc}\`, \`\\usepackage{amsmath}\`, \`\\usepackage{graphicx}\`, \`\\usepackage{geometry}\` (e.g., \`\\geometry{a4paper, margin=1in}\`), and \`\\usepackage{hyperref}\`. Add other packages only if the content explicitly requires them.
4.  Create a suitable title, author (use "Wordara AI"), and date (\`\\today\`).
5.  Use standard LaTeX commands for sections, lists, bold (\`\\textbf\`), italics (\`\\textit\`), and mathematical environments.
6.  Ensure the document structure is logical and readable, and all environments are correctly opened and closed.
7.  End the document with \`\\end{document}\`.

Here is the content to convert:
---
${content}
---
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
    console.error('Error in LaTeX generation API call:', error);
    return new Response('Failed to generate LaTeX code from AI', { status: 500 });
  }
}