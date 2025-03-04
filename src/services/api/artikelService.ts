import { supabase } from '@/lib/supabase';
import type { Artikel } from '@/types';
import { handleApiError } from '@/utils';

export const artikelService = {
  async getArtikel(): Promise<Artikel[]> {
    try {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}; 