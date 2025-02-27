export interface Standort {
  id: string;
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
  beschreibung?: string;
  kategorie: 'Verbrauchsmaterial' | 'Büromaterial' | 'Hardware';
  einheit: string;
  mindestbestand?: number;
  created_at?: string;
  serviceintervall_monate?: number | null;
  wechselintervall_jahre?: number | null;
  standort_id?: string | null;
  verantwortlicher?: {
    name: string;
    email: string;
    telefon: string;
  } | null;
}

export interface HardwareArtikel extends Artikel {
  serviceintervall_monate: number;
  wechselintervall_jahre: number;
  standort_id: string;
  verantwortlicher: {
    name: string;
    email: string;
    telefon: string;
  };
}

export interface BestellPosition {
  artikel_id: string;
  menge: number;
}

export type BestellungStatus = 'offen' | 'versendet' | 'eingetroffen' | 'storniert';

export interface BestellungType {
  id: string;
  standort_id: string;
  status: BestellungStatus;
  created_at: string;
  ersteller_id: string;
  versender_id?: string;
  versand_datum?: string;
  eingetroffen_datum?: string;
  bestellung_artikel: {
    id: string;
    menge: number;
    versandte_menge: number;
    artikel: {
      name: string;
    };
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

export interface WareneingangData {
  id: string;
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
    kategorie: string;
  };
  menge: number;
  lagerorte: LagerortPosition[];
  bestellung?: {
    id: string;
    created_at: string;
  };
}

export interface BestandsArtikel {
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
    kategorie: string;
  };
  menge: number;
  lagerorte: Map<string, number>;
} 