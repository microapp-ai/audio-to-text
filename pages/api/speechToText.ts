import { NextApiRequest, NextApiResponse } from 'next';

function base64dataToBlob(base64data: string, mimeType: string): Blob {
  const byteCharacters = atob(base64data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end(); // Preflight request
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    return;
  }
  try {
    const { body } = req;
    const { base64data } = body;

    if (!base64data) {
      return res
        .status(400)
        .json({ error: 'Missing base64data in request body' });
    }

    const blob = base64dataToBlob(base64data, 'audio/wav');
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('model', 'whisper-1');
    console.log('formData', formData);
    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );
    const json = await response.json();
    console.log('json', json);
    const { text } = json;
    res.status(200).json({ text });
  } catch (error) {
    console.error('Error during API request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
