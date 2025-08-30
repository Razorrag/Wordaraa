// src/pages/api/fetch-url.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    try {
      const { url } = req.body;
  
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
  
      let validUrl;
      try {
        validUrl = new URL(url);
      } catch (_) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      
      // Server-side log to show the request is being received
      console.log(`[API /fetch-url] Fetching content from: ${validUrl.href}`);
  
      const response = await fetch(validUrl.href, {
        headers: {
          // Some sites, like GitHub raw content, don't require special headers,
          // but it can be useful to mimic a browser to avoid getting blocked.
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
  
      if (!response.ok) {
        console.error(`[API /fetch-url] Failed to fetch. Status: ${response.status}`);
        throw new Error(`Failed to fetch from URL. Status: ${response.status}`);
      }
  
      const content = await response.text();
  
      console.log(`[API /fetch-url] Successfully fetched ${content.length} characters.`);
      res.status(200).json({ content });
  
    } catch (error) {
      console.error('[API /fetch-url] Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch content from the provided URL.' });
    }
  }