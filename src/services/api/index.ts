import { supabase } from '@/lib/supabase';
import type { User, Bestellung } from '@/types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_view')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, role });

    if (error) throw error;
  }
};

export const bestellungService = {
  async createBestellung(data: Partial<Bestellung>): Promise<Bestellung> {
    const { data: bestellung, error } = await supabase
      .from('bestellungen')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return bestellung;
  }
};

export * from './artikelService';
export * from './standortService';
export * from './userService';
export * from './bestellungService'; 