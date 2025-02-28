export interface Ausbuchung {
  id: string;
  standort_id: string;
  artikel_id: string;
  menge: number;
  lagerort: string;
  referenz: string;
  created_at: string;
  storniert: boolean;
  standort: {
    name: string;
  };
  artikel: {
    name: string;
    artikelnummer: string;
    einheit: string;
  };
}

export interface AusbuchungGruppe {
  referenz: string;
  created_at: string;
  standort: {
    name: string;
  };
  positionen: Ausbuchung[];
}

export interface Artikel {
  id: string;
  name: string;
  artikelnummer: string;
  kategorie: string;
  einheit: string;
  created_at?: string;
  updated_at?: string;
}

export interface HardwareArtikel extends Artikel {
  last_service?: string;
  next_service?: string;
  seriennummer?: string;
} 