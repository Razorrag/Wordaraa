
// src/pages/api/upload.js

import { formidable } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Disable Next.js's default body parser to allow formidable to handle the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file[0]; // Assumes the file input is named 'file'

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let extractedText = '';
    const filePath = uploadedFile.filepath;
    const fileType = uploadedFile.mimetype;

    if (fileType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
      const { value } = await mammoth.extractRawText({ path: filePath });
      extractedText = value;
    } else { // Handle plain text files as a fallback
       extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({ content: extractedText });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to process file.' });
  }
}