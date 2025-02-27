import type { Verantwortlicher } from '@/types';

export async function getVerantwortliche(): Promise<Verantwortlicher[]> {
  try {
    const response = await fetch('/data/verantwortliche.json');
    if (!response.ok) {
      throw new Error('Verantwortliche konnten nicht geladen werden');
    }
    return response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Verantwortlichen:', error);
    return [];
  }
} 