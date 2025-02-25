import { NextApiRequest, NextApiResponse } from 'next';
import { sendBestellungEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, bestellung } = req.body;

    if (!email || !bestellung) {
      return res.status(400).json({ message: 'Email and bestellung are required' });
    }

    await sendBestellungEmail(email, bestellung);
    
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
} 