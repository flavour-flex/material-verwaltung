export interface Standort {
  id?: string;
  name: string;
  verantwortliche: string[];
}

export interface Verantwortlicher {
  email: string;
  full_name: string;
}

export interface Artikel {
  id?: string;
  name: string;
  artikelnummer: string;
  beschreibung?: string;
  kategorie: "Hardware" | "Software" | "Verbrauchsmaterial" | "Büromaterial" | "Sonstiges";
  einheit?: string;
  mindestbestand?: number;
}

export interface HardwareArtikel extends Artikel {
  seriennummer?: string;
}

export interface BestellPosition {
  artikel: Artikel;
  menge: number;
  versandte_menge?: number;
}

export interface BestellungType {
  id?: string;
  bestellnummer: string;
  positionen: BestellPosition[];
  standort: {
    name: string;
    verantwortlicher?: Verantwortlicher;
  };
  artikel: {
    artikel: {
      name: string;
      artikelnummer: string;
    };
    menge: number;
    versandte_menge: number;
  }[];
}

export interface WareneingangData {
  datum: Date;
  menge: number;
}

export interface BestandsArtikel {
  artikel: Artikel;
  bestand: number;
}

export interface LagerortPosition {
  lagerort: string;
  menge: number;
}

export interface BestellungArtikel {
  id: string;
  name: string;
  artikelnummer: string;
  beschreibung?: string;
  kategorie: string;
}

export interface Hardware {
  id: string;
  artikel_id: string;
  serviceintervall_monate?: number;
  wechselintervall_jahre?: number;
  verantwortlicher?: string;
}

export interface UserRole {
  id: string;
  name: string;
}

export interface WareneingangPosition {
  artikel: {
    name: string;
    artikelnummer: string;
  };
  menge: number;
  versandte_menge: number;
} 