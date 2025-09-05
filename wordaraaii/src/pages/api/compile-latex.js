// src/pages/api/compile-latex.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { latex } = req.body;
    if (!latex) {
      return res.status(400).json({ error: 'LaTeX content is required.', log: 'No LaTeX content was provided.' });
    }

    // --- FIX: The correct endpoint is the base URL, not /compile ---
    const response = await fetch('https://latexonline.cc/compile/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: latex,
        command: 'pdflatex'
      }),
    });

    // --- BULLETPROOF ERROR HANDLING ---
    // First, check if the HTTP response status is successful.
    if (!response.ok) {
      // If not, the service returned an error (e.g. 500, 502, 404).
      // The body is likely HTML or plain text, not JSON.
      const errorText = await response.text();
      const logMessage = `External compilation service failed with status ${response.status}. Response: ${errorText.substring(0, 500)}`; // Truncate to avoid huge logs
      console.error('LaTeX Service HTTP Error:', logMessage);
      
      // Send our consistent JSON error format back to the frontend.
      return res.status(400).json({ error: 'Compilation service is unavailable or returned an error.', log: logMessage });
    }
    
    // If the status is OK, now we can safely parse the body as JSON.
    const result = await response.json();

    // Now, check the logical status inside the JSON payload.
    if (result.status === 'error') {
      const errorLog = result.log || 'Unknown compilation error from latexonline.cc.';
      console.error('LaTeX Code Compilation Error:', errorLog);
      return res.status(400).json({ error: 'Compilation failed due to LaTeX errors.', log: errorLog });
    }

    // Handle the success case
    if (result.status === 'success' && result.result) {
      const pdfBuffer = Buffer.from(result.result, 'base64');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      res.send(pdfBuffer);
    } else {
      throw new Error('Unexpected successful response format from compilation service.');
    }

  } catch (error) {
    // This outer catch handles network failures or any other unexpected errors.
    console.error('Error in /api/compile-latex:', error);
    res.status(500).json({ error: 'An internal server error occurred.', log: error.message });
  }
}
