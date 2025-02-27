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