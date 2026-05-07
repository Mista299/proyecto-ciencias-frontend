import axios from 'axios';
import { Occurrence, QualityStats, MappingReport, ETLResult, TaxonResumen } from './types';

const BASE = 'http://localhost:8000';
const http = axios.create({ baseURL: BASE });

export type OccurrenceFilter = {
  collection_code?: string;
  taxon?: string;
  family?: string;
  state_province?: string;
  disposition?: string;
  identified_by?: string;
  verification_status?: string;
  con_coordenadas?: boolean;
  year_from?: number;
  year_to?: number;
  skip?: number;
  limit?: number;
};

export const api = {
  getOccurrences: (filters: OccurrenceFilter = {}) =>
    http.get<Occurrence[]>('/occurrences/', { params: filters }).then(r => r.data),

  getOccurrence: (id: string) =>
    http.get<Occurrence>(`/occurrences/${id}`).then(r => r.data),

  deleteOccurrence: (id: string) =>
    http.delete(`/occurrences/${id}`).then(r => r.data),

  getTaxonResumen: () =>
    http.get<TaxonResumen>('/taxa/resumen').then(r => r.data),

  getCalidad: () =>
    http.get<QualityStats>('/stats/calidad').then(r => r.data),

  getDistribucion: () =>
    http.get<{ country: string; count: number }[]>('/stats/distribucion-geografica').then(r => r.data),

  previsualizarMapeo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<MappingReport>('/etl/previsualizar-mapeo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  cargarArchivo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<ETLResult>('/etl/cargar-archivo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  cargarDirectorio: () =>
    http.post<ETLResult[]>('/etl/cargar-directorio').then(r => r.data),

  cargarMultiples: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return http.post<ETLResult[]>('/etl/cargar-multiples', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  createOccurrence: (data: object) =>
    http.post<Occurrence>('/occurrences/', data).then(r => r.data),

  updateOccurrence: (id: string, data: object) =>
    http.patch<Occurrence>(`/occurrences/${id}`, data).then(r => r.data),

  updateTaxon: (id: string, data: object) =>
    http.patch<Occurrence>(`/occurrences/${id}/taxon`, data).then(r => r.data),

  updateEvent: (id: string, data: object) =>
    http.patch<Occurrence>(`/occurrences/${id}/event`, data).then(r => r.data),

  updateLocation: (id: string, data: object) =>
    http.patch<Occurrence>(`/occurrences/${id}/location`, data).then(r => r.data),

  updateIdentification: (id: string, data: object) =>
    http.patch<Occurrence>(`/occurrences/${id}/identification`, data).then(r => r.data),
};
