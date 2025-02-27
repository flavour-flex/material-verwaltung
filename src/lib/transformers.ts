import type { 
  WareneingangData, 
  BestandsArtikel, 
  BestellungType,
  BestellungArtikel 
} from '@/types';

export const transformWareneingang = (data: any): WareneingangData => ({
  id: data.id,
  artikel: data.artikel && {
    id: data.artikel.id,
    name: data.artikel.name,
    artikelnummer: data.artikel.artikelnummer,
    kategorie: data.artikel.kategorie
  },
  menge: data.menge,
  lagerorte: Array.isArray(data.lagerorte) ? data.lagerorte : [],
  bestellung: data.bestellung && {
    id: data.bestellung.id,
    created_at: data.bestellung.created_at
  }
});

export const transformToBestandsArtikel = (data: any): BestandsArtikel => ({
  artikel: {
    id: data.artikel.id,
    name: data.artikel.name,
    artikelnummer: data.artikel.artikelnummer,
    kategorie: data.artikel.kategorie
  },
  menge: data.menge,
  lagerorte: new Map(data.lagerorte?.map(l => [l.lagerort, l.menge]) || [])
});

export const transformBestellung = (data: any): BestellungType => ({
  id: data.id,
  standort_id: data.standort_id,
  status: data.status,
  created_at: data.created_at,
  ersteller_id: data.ersteller_id,
  versender_id: data.versender_id,
  versand_datum: data.versand_datum,
  eingetroffen_datum: data.eingetroffen_datum,
  artikel: Array.isArray(data.artikel) ? data.artikel.map(transformBestellungArtikel) : [],
  standort: data.standort,
  ersteller: data.ersteller,
  versender: data.versender
});

export const transformBestellungArtikel = (data: any): BestellungArtikel => ({
  id: data.id,
  artikel_id: data.artikel_id,
  menge: data.menge,
  versandte_menge: data.versandte_menge || 0,
  artikel: data.artikel && {
    id: data.artikel.id,
    name: data.artikel.name,
    artikelnummer: data.artikel.artikelnummer
  }
}); 