import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import type { Verantwortlicher } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { bestellung } = req.body;
    const verantwortlicher: Verantwortlicher = bestellung.standort.verantwortlicher;

    if (!verantwortlicher?.email) {
      return res.status(400).json({ 
        message: 'Keine Email-Adresse für Verantwortlichen gefunden' 
      });
    }

    const artikelListe = bestellung.artikel
      .map((pos: any) => `- ${pos.artikel.name} (${pos.versandte_menge} Stück)`)
      .join('\n');

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: verantwortlicher.email,
      subject: `Bestellung #${bestellung.id} wurde versendet - ${bestellung.standort.name}`,
      html: `
        <h2>Ihre Bestellung wurde versendet</h2>
        <p>Sehr geehrte(r) ${verantwortlicher.name},</p>
        <p>Ihre Bestellung für den Standort ${bestellung.standort.name} wurde versendet und liegt im Wareneingang bereit.</p>
        <h3>Versendete Artikel:</h3>
        <pre>${artikelListe}</pre>
        <p>Bitte buchen Sie die Artikel zeitnah in Ihren Bestand ein.</p>
        <p>Mit freundlichen Grüßen<br>Ihr Hauptlager-Team</p>
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