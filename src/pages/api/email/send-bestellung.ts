import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Hole die Hauptlager-Email aus den Einstellungen
    const { data: einstellungen, error: settingsError } = await supabase
      .from('einstellungen')
      .select('hauptlager_email')
      .single();

    if (settingsError) throw settingsError;
    if (!einstellungen?.hauptlager_email) {
      throw new Error('Keine Hauptlager-Email konfiguriert');
    }

    const { bestellung } = req.body;
    
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY ist nicht konfiguriert');
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM ist nicht konfiguriert');
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: einstellungen.hauptlager_email,
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
      `,
    });

    console.log('Email sending attempt:', {
      to: einstellungen.hauptlager_email,
      bestellung: bestellung,
      resendResponse: { data, error }
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 