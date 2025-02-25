import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { sendWechselEmail } from '@/lib/email';
import { addYears, addMonths, isBefore } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Hole Einstellungen
    const { data: einstellungen, error: settingsError } = await supabase
      .from('einstellungen')
      .select('wechsel_email, wechsel_benachrichtigung_monate')
      .single();

    if (settingsError) throw settingsError;
    if (!einstellungen.wechsel_email) {
      return res.status(200).json({ message: 'No wechsel email configured' });
    }

    // Hole Hardware mit anstehendem Wechsel
    const { data: hardware, error: hardwareError } = await supabase
      .from('hardware')
      .select(`
        *,
        artikel:artikel_id(*),
        standort:standort_id(name)
      `);

    if (hardwareError) throw hardwareError;

    const now = new Date();
    
    for (const item of hardware) {
      const installationDate = new Date(item.created_at);
      const wechselDate = addYears(installationDate, item.wechselintervall_jahre);
      const notificationDate = addMonths(wechselDate, -einstellungen.wechsel_benachrichtigung_monate);

      if (isBefore(notificationDate, now) && !item.wechsel_notified) {
        await sendWechselEmail(einstellungen.wechsel_email, item);
        
        // Markiere als benachrichtigt
        await supabase
          .from('hardware')
          .update({ wechsel_notified: true })
          .eq('id', item.id);
      }
    }

    res.status(200).json({ message: 'Wechsel check completed' });
  } catch (error) {
    console.error('Wechsel check failed:', error);
    res.status(500).json({ message: 'Wechsel check failed' });
  }
} 