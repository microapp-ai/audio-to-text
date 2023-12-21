import { NextApiRequest, NextApiResponse } from 'next';

export default async function summarize(
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

  const { text } = req.body;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates Summaries.',
          },
          {
            role: 'user',
            content: `Summarize the following text: ${text}`,
          },
        ],
        model: 'gpt-3.5-turbo',
        max_tokens: 3000,
        temperature: 1,
        stop: '',
      }),
    });
    const data = await response.json();
    // console.log('data', data);
    const summary = data.choices[0].message.content;
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error during API request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
