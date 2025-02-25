export interface Standort {
  id: number;
  name: string;
  adresse: string;
  plz: string;
  stadt: string;
  land: string;
  verantwortliche: Verantwortlicher[];
  created_at: string;
}

export interface Verantwortlicher {
  name: string;
  email: string;
  telefon: string;
}

export interface Artikel {
  id: string;
  name: string;
  artikelnummer: string;
  beschreibung: string;
  kategorie: string;
  einheit: string;
}

export interface Hardware extends Artikel {
  serviceintervall_monate: number;
  wechselintervall_jahre: number;
  standort_id: string;
  verantwortlicher: Verantwortlicher;
}

export interface BestellPosition {
  artikel_id: string;
  menge: number;
}

export type BestellungStatus = 'offen' | 'versendet' | 'eingetroffen' | 'storniert';

export interface Bestellung {
  id: string;
  standort_id: string;
  status: BestellungStatus;
  created_at: string;
  ersteller_id: string;
  versender_id?: string;
  versand_datum?: string;
  eingetroffen_datum?: string;
  artikel: {
    id: string;
    menge: number;
    artikel: Artikel;
  }[];
  standort?: {
    name: string;
  };
  ersteller?: {
    email: string;
    full_name: string;
  };
  versender?: {
    email: string;
    full_name: string;
  };
}

export interface LagerortPosition {
  lagerort: string;
  menge: number;
}

export interface WareneingangPosition {
  artikel_id: string;
  menge: number;
  lagerorte: LagerortPosition[];
}

export interface Wareneingang {
  id: string;
  standort_id: string;
  bestellung_id: string;
  artikel: WareneingangPosition[];
  eingebucht_am: string;
} 