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
  kategorie: 'verbrauchsmaterial' | 'bueromaterial' | 'hardware';
  einheit?: string;
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
  seriennummer?: string;
  anschaffungsdatum?: string;
  garantie_bis?: string;
  wartung_intervall?: number;
  letzte_wartung?: string;
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
  status: BestellungStatus;
  created_at: string;
  standort_id: string;
  bestellung_artikel: BestellungArtikelType[];
  standort?: {
    name: string;
    adresse?: string;
    verantwortliche?: Verantwortlicher[];
  };
  ersteller_id: string;
  versender_id?: string;
  versand_datum?: string;
  eingetroffen_datum?: string;
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

export interface BestellungArtikelType {
  id: string;
  artikel_id: string;
  menge: number;
  versandte_menge: number;
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
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

export interface WareneingangData {
  bestellung_id: string;
  artikel_id: string;
  menge: number;
  lagerorte: LagerortPosition[];
} 