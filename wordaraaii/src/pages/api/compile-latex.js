// src/pages/api/compile-latex.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { latex, engine } = req.body;
    if (!latex) {
      return res.status(400).json({ error: 'LaTeX content is required.', log: 'No LaTeX content was provided.' });
    }

    const allowed = new Set(['pdflatex', 'xelatex', 'lualatex']);
    const selectedEngine = (typeof engine === 'string' && allowed.has(engine.toLowerCase()))
      ? engine.toLowerCase()
      : 'pdflatex';

    // Helper: compile via latexonline.cc (preferred). This endpoint expects GET with query params.
    const compileWithLatexOnline = async () => {
      const endpoint = 'https://latexonline.cc/compile';
      const params = new URLSearchParams();
      params.set('text', latex);
      params.set('engine', selectedEngine);
      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url, { method: 'GET' });
      return response;
    };

    // Helper: fallback to texlive.net latexcgi
    const compileWithTexlive = async () => {
      const endpoint = 'https://texlive.net/cgi-bin/latexcgi';
      const params = new URLSearchParams();
      params.set('text', latex);
      params.set('format', 'pdf');
      params.set('engine', selectedEngine);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      return response;
    };

    // Try primary service first
    let response = await compileWithLatexOnline();

    // If not OK or not a PDF, try the fallback
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (
      !response.ok ||
      !(contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))
    ) {
      const primaryErrorText = await response.text().catch(() => '');
      console.error('latexonline.cc compile failed:', primaryErrorText);
      const fallback = await compileWithTexlive();
      if (!fallback.ok) {
        const fallbackText = await fallback.text().catch(() => '');
        return res.status(502).json({
          error: 'Compilation failed in both services.',
          log: `Primary (latexonline.cc): ${primaryErrorText}\nFallback (texlive.net): ${fallbackText}`,
        });
      }
      response = fallback; // Use fallback response
    }

    // On success, the service returns the raw PDF file data
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in /api/compile-latex:', error);
    res.status(500).json({ error: 'An internal server error occurred.', log: error.message });
  }
}