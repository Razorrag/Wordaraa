import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Set the runtime to edge
export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new Response('Content is required', { status: 400 });
    }
    
    // A specific prompt to instruct the AI to act as a LaTeX expert.
    const prompt = `You are an expert LaTeX document creator. Your task is to convert the following text or markdown content into a complete, well-structured, and beautifully formatted LaTeX document.

**Instructions:**
1.  The output MUST be only the raw LaTeX code.
2.  Start the document with \`\\documentclass{article}\`.
3.  Include necessary packages like \`geometry\`, \`amsmath\`, \`graphicx\`, etc., if the content requires them.
4.  Create a suitable title, author (use "Wordara AI"), and date based on the content.
5.  Use appropriate LaTeX commands for sections, subsections, lists (itemize, enumerate), bold (\`\\textbf\`), italics (\`\\textit\`), and mathematical equations.
6.  Ensure the document structure is logical and readable.
7.  Do NOT include any explanations, comments, or markdown fences (like \`\`\`latex\`) in your response. The output must be ready to compile directly.
8.  End the document with \`\\end{document}\`.

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
