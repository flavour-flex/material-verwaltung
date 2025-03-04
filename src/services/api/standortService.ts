import { supabase } from '@/lib/supabase';
import type { Standort } from '@/types';
import { handleApiError } from '@/utils';

export const standortService = {
  async getStandorte(): Promise<Standort[]> {
    try {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getStandort(id: string): Promise<Standort> {
    try {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}; 