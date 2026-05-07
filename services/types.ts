export interface Occurrence {
  occurrenceID: string;
  catalogNumber: string;
  collectionCode: string;
  basisOfRecord: string;
  occurrenceStatus: string;
  disposition?: string;
  sex?: string;
  recordedBy?: string;
  sourceFile?: string;
  taxon?: {
    scientificName: string;
    taxonRank: string;
    family?: string;
    genus?: string;
  };
  event?: {
    eventDate?: string;
    habitat?: string;
  };
  location?: {
    country?: string;
    stateProvince?: string;
    county?: string;
    locality?: string;
    decimalLatitude?: number;
    decimalLongitude?: number;
  };
  identification?: {
    identifiedBy?: string;
    dateIdentified?: string;
    verificationStatus?: string;
  };
}

export interface QualityStats {
  total_registros: number;
  completitud: {
    con_fecha_evento:      { cantidad: number; porcentaje: number };
    con_coordenadas:       { cantidad: number; porcentaje: number };
    con_nombre_cientifico: { cantidad: number; porcentaje: number };
    con_pais:              { cantidad: number; porcentaje: number };
  };
  por_coleccion: Record<string, number>;
  por_estado:    Record<string, number>;
}

export interface MappingReport {
  total_columnas: number;
  mapeadas: number;
  sin_mapear: string[];
  dwc_cubiertos: string[];
  dwc_faltantes: string[];
  cobertura_pct: number;
  mapeo?: Record<string, string | null>;
}

export interface ETLResult {
  archivo: string;
  total_filas: number;
  insertados: number;
  actualizados: number;
  omitidos: number;
  errores: string[];
  mapeo: { total_columnas: number; mapeadas: number; sin_mapear: string[] };
}

export interface TaxonResumen {
  total_taxones: number;
  por_familia: { familia: string; count: number }[];
  por_orden:   { orden: string; count: number }[];
}
