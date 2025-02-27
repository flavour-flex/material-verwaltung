import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, bestellung } = req.body;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Neue Bestellung von ${bestellung.standort?.name || 'Unbekannter Standort'}`,
      html: `
        <h1>Neue Bestellung eingegangen</h1>
        <p>Standort: ${bestellung.standort?.name || 'Unbekannter Standort'}</p>
        <h2>Bestellte Artikel:</h2>
        <ul>
          ${bestellung.artikel.map((pos: any) => `
            <li>${pos.artikel?.name || 'Unbekannter Artikel'} - ${pos.menge} Stück</li>
          `).join('')}
        </ul>
      `
    });

    if (error) {
      console.error('Email error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: error.message });
  }
} 