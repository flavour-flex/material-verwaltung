import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { sendServiceEmail } from '@/lib/email';
import { addMonths, isBefore } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Hole Einstellungen
    const { data: einstellungen, error: settingsError } = await supabase
      .from('einstellungen')
      .select('service_email, service_benachrichtigung_tage')
      .single();

    if (settingsError) throw settingsError;
    if (!einstellungen.service_email) {
      return res.status(200).json({ message: 'No service email configured' });
    }

    // Hole Hardware mit anstehendem Service
    const { data: hardware, error: hardwareError } = await supabase
      .from('hardware')
      .select(`
        *,
        artikel:artikel_id(*),
        standort:standort_id(name)
      `);

    if (hardwareError) throw hardwareError;

    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + einstellungen.service_benachrichtigung_tage);

    for (const item of hardware) {
      const lastService = new Date(item.last_service || item.created_at);
      const nextService = addMonths(lastService, item.serviceintervall_monate);

      if (isBefore(nextService, checkDate)) {
        await sendServiceEmail(einstellungen.service_email, item);
      }
    }

    res.status(200).json({ message: 'Service check completed' });
  } catch (error) {
    console.error('Service check failed:', error);
    res.status(500).json({ message: 'Service check failed' });
  }
} 